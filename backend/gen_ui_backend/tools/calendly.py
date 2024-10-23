import os
from typing import Dict, Union

import requests
from langchain_core.tools import tool

CALENDLY_ACCOUNT = os.environ.get("CALENDLY_ACCOUNT")

@tool("calendly", return_direct=True)
def calendly() -> Union[Dict, str]:
    """Schedule a meeting or call or screening or interview using Calendly. Talk to the real Connor Haines."""
    try:
        return {
            "account": CALENDLY_ACCOUNT,
        }
    except requests.exceptions.RequestException as err:
        print(err)
        return {"error": "There was an error setting up calendly."}