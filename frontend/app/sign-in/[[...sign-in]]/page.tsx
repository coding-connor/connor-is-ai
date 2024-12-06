"use client";

import * as React from "react";
import { useSignUp, useSignIn } from "@clerk/nextjs";
import { EmailCodeFactor, SignInFirstFactor } from "@clerk/types";
import { useRouter } from "next/navigation";
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ERROR_USER_ALREADY_EXISTS = "form_identifier_exists";
const ERROR_INCORRECT_CODE = "form_code_incorrect";

export default function Page() {
  const {
    isLoaded: isLoadedSignUp,
    signUp,
    setActive: setActiveSignUp,
  } = useSignUp();
  const {
    isLoaded: isLoadedSignIn,
    signIn,
    setActive: setActiveSignIn,
  } = useSignIn();
  const [verifyingSignUp, setVerifyingSignUp] = React.useState(false);
  const [verifyingSignIn, setVerifyingSignIn] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const router = useRouter();

  const [error, setError] = React.useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    setError(null);
    e.preventDefault();

    if (!isLoadedSignUp && !signUp) return null;

    try {
      await signUp.create({
        emailAddress: email,
      });

      await signUp.prepareEmailAddressVerification();

      setVerifyingSignUp(true);
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        const errorCode = err.errors[0].code;
        if (errorCode === ERROR_USER_ALREADY_EXISTS) {
          handleSignIn(e);
        } else {
          setError("Sorry, an unexpected error occurred.");
        }
      } else {
        setError("Sorry, an unexpected error occurred.");
      }
    }
  }

  async function handleSignUpVerification(e: React.FormEvent) {
    setError(null);
    e.preventDefault();

    if (!isLoadedSignUp && !signUp) return null;

    try {
      const signInAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signInAttempt.status === "complete") {
        await setActiveSignUp({ session: signInAttempt.createdSessionId });

        router.push("/");
      } else {
        setError("Sorry, an unexpected error occurred.");
      }
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        const errorCode = err.errors[0].code;
        if (errorCode === ERROR_INCORRECT_CODE) {
          setError(
            "Wrong code. Refresh the page if you need to resend the code.",
          );
        } else {
          setError("Sorry, an unexpected error occurred.");
        }
      } else {
        setError("Sorry, an unexpected error occurred.");
      }
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoadedSignIn && !signIn) return null;

    try {
      const { supportedFirstFactors } = await signIn.create({
        identifier: email,
      });

      const isEmailCodeFactor = (
        factor: SignInFirstFactor,
      ): factor is EmailCodeFactor => {
        return factor.strategy === "email_code";
      };
      const emailCodeFactor = supportedFirstFactors?.find(isEmailCodeFactor);

      if (emailCodeFactor) {
        const { emailAddressId } = emailCodeFactor;

        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId,
        });

        setVerifyingSignIn(true);
      }
    } catch (err) {
      setError("Sorry, an unexpected error occurred.");
    }
  }

  async function handleSignInVerification(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoadedSignIn && !signIn) return null;

    try {
      const signInAttempt = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

      if (signInAttempt.status === "complete") {
        await setActiveSignIn({ session: signInAttempt.createdSessionId });

        router.push("/");
      } else {
        setError("Sorry, an unexpected error occurred.");
      }
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        const errorCode = err.errors[0].code;
        if (errorCode === ERROR_INCORRECT_CODE) {
          setError(
            "Wrong code. Refresh the page if you need to resend the code.",
          );
        } else {
          setError("Sorry, an unexpected error occurred.");
        }
      } else {
        setError("Sorry, an unexpected error occurred.");
      }
    }
  }

  if (verifyingSignUp) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
          <form
            onSubmit={handleSignUpVerification}
            className="flex flex-col gap-4"
          >
            <input
              placeholder="Enter your verification code"
              value={code}
              id="code"
              name="code"
              onChange={(e) => setCode(e.target.value)}
              className="p-2 text-lg border rounded"
            />
            <button
              type="submit"
              className="p-2 text-lg bg-blue-500 text-white rounded cursor-pointer"
            >
              Verify
            </button>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </form>
        </div>
      </div>
    );
  }

  if (verifyingSignIn) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
          <form
            onSubmit={handleSignInVerification}
            className="flex flex-col gap-4"
          >
            <input
              value={code}
              placeholder="Enter your verification code"
              id="code"
              name="code"
              onChange={(e) => setCode(e.target.value)}
              className="p-2 text-lg border rounded"
            />
            <button
              type="submit"
              className="p-2 text-lg bg-blue-500 text-white rounded cursor-pointer"
            >
              Verify
            </button>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen p-1">
      <img
        src={"/avatars/me.png"}
        alt="Avatar Logo"
        width={200}
        height={200}
        className="mx-auto"
      />
      <div className="flex justify-center gap-2 mt-2">
        <a
          href="https://linkedin.com/in/connorhaines"
          target="_blank"
          className="items-center"
        >
          <FontAwesomeIcon icon={faLinkedin} className="h-6" />
        </a>
        <a
          href="https://github.com/coding-connor"
          target="_blank"
          className="items-center"
        >
          <FontAwesomeIcon icon={faGithub} className="h-6" />
        </a>
        <a
          href="https://calendly.com/connor-haines"
          target="_blank"
          className="items-center"
        >
          <FontAwesomeIcon icon={faCalendar} className="h-6" />
        </a>
      </div>
      <div className="text-center max-w-lg w-full mt-4">
        <div className="text-xl font-bold mb-4">
          Hi, I'm Connor Haines's AI representative, and I look forward to
          chatting with you!
        </div>
        <p className="text-[16px] text-center font-medium">
          I promise there's no lengthy sign-up, but I do need to make sure
          you're real. To begin chatting with me, please enter your email to
          receive a one-time passcode.
        </p>
        <form onSubmit={handleSignUp} className="flex flex-col gap-4 mt-2">
          <input
            value={email}
            placeholder="Enter your email"
            id="email"
            name="email"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 text-lg border rounded"
          />
          <button
            type="submit"
            className="p-2 text-lg bg-blue-500 text-white rounded cursor-pointer"
          >
            Submit
          </button>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </form>
      </div>
    </div>
  );
}
