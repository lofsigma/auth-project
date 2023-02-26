import { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/typescript-types";
import { startAuthentication } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { signIn } from "next-auth/react";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [username2, setUsername2] = useState("");
  const [password, setPassword] = useState("");

  const { data: options, refetch } = api.example.webauthn.useQuery(
    { username: username },
    { enabled: false }
  );

  useEffect(() => {
    const asyncStuff = async () => {
      if (!options) return;
      const credential = await startAuthentication(options);
      signIn("webauthn", {
        username: username,
        id: credential.id,
        rawId: credential.rawId,
        type: credential.type,
        clientDataJSON: credential.response.clientDataJSON,
        authenticatorData: credential.response.authenticatorData,
        signature: credential.response.signature,
        userHandle: credential.response.userHandle,
      });
    };

    asyncStuff();
  }, [options]);

  const handleWebAuthn = async () => {
    // get credential from
    // const url = new URL(
    //   "/api/auth/webauthn/authenticate",
    //   window.location.origin
    // );
    // url.search = new URLSearchParams({ email }).toString();
    // const optionsResponse = await fetch(url.toString());
    await refetch();
    // console.log("options", options);
    // // console.log("webauthn", mutationWebauthn.data);
    // setTimeout(() => {});

    // const credential = await startAuthentication(options);

    // console.log("credential", credential);

    // await signIn("credentials", {
    //   id: credential.id,
    //   rawId: credential.rawId,
    //   type: credential.type,
    //   clientDataJSON: credential.response.clientDataJSON,
    //   authenticatorData: credential.response.authenticatorData,
    //   signature: credential.response.signature,
    //   userHandle: credential.response.userHandle,
    // });
  };

  const handlePassword = async () => {
    signIn("password", { username: username2, password: password });
  };
  return (
    <>
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          name="username"
          type="text"
          id="username"
          autoComplete="username"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="button" onClick={handleWebAuthn}>
          Sign in
        </button>
      </form>
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          name="username"
          type="text"
          id="username2"
          autoComplete="username"
          placeholder="username"
          value={username2}
          onChange={(e) => setUsername2(e.target.value)}
        />
        <input
          name="password"
          type="password"
          id="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="button" onClick={handlePassword}>
          Sign in
        </button>
      </form>
    </>
  );
}
