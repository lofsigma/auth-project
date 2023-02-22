import { Session } from "inspector";
import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "../../utils/api";
import { useRouter } from "next/router";

export default function Role() {
  const router = useRouter();
  const { name } = router.query;
  const { data: session } = useSession();

  if (!session) return <button onClick={signIn}>SIGN IN</button>;

  return (
    <>
      <div className="mt-8 mb-8 flex items-center justify-between">
        <div className="text-medium uppercase">{name}</div>
        <button
          onClick={signOut}
          className="w-fit rounded-md bg-gray-100 px-4 py-2 hover:bg-black hover:text-white"
        >
          logout
        </button>
      </div>
      <RoleInfo session={session} name={name} />
    </>
  );
}

const RoleInfo = ({ session, name }) => {
  if (!session) return <div>...</div>;

  const { data: user } = api.example.getRoleAlt.useQuery(
    { name: name },
    { enabled: session?.user !== undefined }
  );

  if (!user || user.roles.length == 0) return <div>...</div>;

  return (
    <>
      <table className="text-left uppercase leading-loose">
        <tbody>
          <tr>
            <th>secret</th>
            <td>{user.roles[0].secret}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  return <div>end</div>;
};
