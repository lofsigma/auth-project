import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "../../utils/api";

export default function Profile() {
  const { data: session } = useSession();

  if (!session) return <div>not signed in</div>;

  return (
    <>
      <button
        onClick={() => signOut()}
        className="rounded-md bg-gray-100 px-4 py-2 hover:bg-black hover:text-white"
      >
        logout
      </button>
      <div>{session.user.email}</div>
      <UserRoles />
    </>
  );
}

const UserRoles: React.FC = () => {
  const { data: session } = useSession();

  if (!session) return <div></div>;

  const { data: user } = api.example.getUser.useQuery(
    { id: session.user.id }, // no input
    { enabled: session?.user !== undefined }
  );

  if (!user) return <div></div>;

  return (
    <>
      {/* <div>{user.email}</div> */}
      {/* {user.roles.map(({ id, name }) => (
        <div>
          {id}: {name}
        </div>
      ))} */}
      <table className="leading-loose">
        <tr className="border-b border-gray-300 text-left">
          <th>role</th>
        </tr>
        {user.roles.map(({ id, name }) => (
          <tr>
            <td>
              <a href={`/role/${name}`}>{name}</a>
            </td>
          </tr>
        ))}
      </table>
    </>
  );
};
