import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "../../utils/api";
import { useRouter } from "next/router";

import Link from "next/link";

export default function Profile() {
  const { data: session } = useSession();

  if (!session) return <button onClick={signIn}>SIGN IN</button>;

  return (
    <>
      <div className="mt-8 mb-8 flex items-center justify-between">
        <div className="text-medium">PROFILE</div>
        <button
          onClick={signOut}
          className="w-fit rounded-md bg-gray-100 px-4 py-2 hover:bg-black hover:text-white"
        >
          logout
        </button>
      </div>
      <User session={session} />
      {/* <UserRoles /> */}
    </>
  );
}

const User: React.FC = ({ session }) => {
  const {
    isLoading,
    isError,
    data: user,
    error,
  } = api.example.getUser.useQuery(
    { id: session.user.id }, // no input
    { enabled: session?.user !== undefined }
  );

  // const mutationPreRegister = api.example.preRegister.useMutation();

  // const handlePreRegister = () => {
  //   mutationPreRegister.mutate({
  //     id: session.user.id,
  //   });
  // };

  const registerWebAuthn = () => {
    // get challenge from server.
    const { data: challenge } = api.example.getUser.useQuery(
      { id: session.user.id },
      { enabled: session?.user !== undefined }
    );

    console.log("challenge", challenge);
  };

  if (isLoading) return <div>...</div>;

  return (
    <>
      <table className="text-left uppercase leading-loose">
        <tbody>
          <tr>
            <th>username</th>
            <td>{user.userName}</td>
          </tr>
          <tr>
            <th>first name</th>
            <td>{user.firstName}</td>
          </tr>
          <tr>
            <th>last name</th>
            <td>{user.lastName}</td>
          </tr>
          <tr>
            <th>birth date</th>
            <td>
              {user.birthDate.toLocaleDateString("en-us", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </td>
          </tr>
          <tr>
            <th>new hire</th>
            <td>{user.newHire.toString()}</td>
          </tr>
          <tr>
            <th>manager id</th>
            <td>{user.managerId}</td>
          </tr>
          <tr>
            <th>personnel area</th>
            <td>{user.personnelArea}</td>
          </tr>
          <tr>
            <th>department</th>
            <td>{user.department}</td>
          </tr>
          <tr>
            <th>cost center</th>
            <td>{user.costcenter}</td>
          </tr>
          <tr>
            <th>roles</th>
            <td className="flex flex-wrap gap-4">
              {user.roles.map((r) => (
                <a
                  key={r.name}
                  href={`/role/${r.name}`}
                  className="underline underline-offset-4"
                >
                  {r.name}
                </a>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
      {/* <button onClick={handlePreRegister} className="mt-8 py-2 px-4">
        register
      </button> */}
      {/* <button onClick={registerWebAuthn} className="mt-8 py-2 px-4 uppercase">
        webauthn
      </button> */}
      {/* <div>
        {mutationPreRegister.data && JSON.stringify(mutationPreRegister.data)}
      </div> */}
    </>
  );
};
