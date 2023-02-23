import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import { api } from "../utils/api";

const Home: NextPage = () => {
  const { data: session } = useSession();
  return (
    <>
      <div className="mt-8 mb-8 flex items-center justify-between">
        <div className="text-medium uppercase">identifyflow</div>
        <button
          onClick={() => (session ? signOut() : signIn())}
          className=" w-fit rounded-md bg-gray-100 px-4 py-2 uppercase hover:bg-black hover:text-white"
        >
          {session ? "logout" : "login"}
        </button>
      </div>
      {session && (
        <a className="uppercase underline underline-offset-4" href="/admin">
          admin
        </a>
      )}
    </>
  );
};

export default Home;
