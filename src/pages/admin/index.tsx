import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "../../utils/api";

export default function Admin() {
  const { data: session } = useSession();

  if (!session) return <div>no session</div>; // TODO REDIRECT

  if (session.user.role === "admin") {
    return (
      <>
        <div className="pb-4 text-xl">Users</div>
        <Users />
        <div className="pb-4 pt-8 text-xl">Roles</div>
        <Roles />
      </>
    );
  } else {
    return <div>you are not an admin</div>;
  }
}

const Users: React.FC = () => {
  const { data: session } = useSession();

  const { data: user } = api.example.getUser.useQuery(
    undefined, // no input
    { enabled: session?.user !== undefined }
  );

  const { data: users } = api.example.getAllUsers.useQuery(
    undefined, // no input
    { enabled: session?.user !== undefined }
  );

  return (
    <>
      <table className="leading-loose">
        <tr className="border-b border-gray-300 text-left">
          <th>email</th>
          <th>roles</th>
        </tr>
        {users?.map((user) => (
          <tr>
            <td>{user.email}</td>
            <td>{user.role}</td>
          </tr>
        ))}
      </table>
    </>
  );
};

const Roles: React.FC = () => {
  const { data: session } = useSession();

  const { data: roles } = api.example.getAllRoles.useQuery(
    undefined, // no input
    { enabled: session?.user !== undefined }
  );

  return (
    <>
      <div>{JSON.stringify(roles)}</div>
      <div className="grid gap-4">
        {roles &&
          roles.map(({ name, users }) => (
            <div className="border-2 border-orange-400 p-2">
              <div className="pb-4 text-lg">{name}</div>
              {users.map((user) => (
                <div className="w-fit border px-2 py-1">{user.email}</div>
              ))}
            </div>
          ))}
      </div>
    </>
  );
};
