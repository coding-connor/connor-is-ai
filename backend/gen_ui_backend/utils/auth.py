import os
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import AuthenticateRequestOptions
from fastapi import Request, HTTPException
import jwt

PUBLIC_KEY_PATH = "jwt_public.pem"


def is_signed_in(request: Request):
    sdk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))
    request_state = sdk.authenticate_request(
        request, AuthenticateRequestOptions(audience=["http://localhost:3000"])
    )
    return request_state


def decode_token(token, public_key_path):
    try:
        # Load the public key from the file
        with open(public_key_path, "r") as key_file:
            public_key = key_file.read()

        # Decode the token using the public key
        decoded = jwt.decode(
            token, public_key, algorithms=["RS256"], audience="http://localhost:3000"
        )
        return decoded.get("email")  # Extract user information
    except jwt.ExpiredSignatureError:
        # Handle expired token
        raise jwt.ExpiredSignatureError("The token has expired")
    except jwt.InvalidTokenError:
        # Handle invalid token
        raise jwt.InvalidTokenError("The token is invalid")


async def auth_dependency(request: Request):
    request_state = is_signed_in(request)
    if not request_state.is_signed_in:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return decode_token(
        request_state.token, PUBLIC_KEY_PATH
    )  # Return the user information
