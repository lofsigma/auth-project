import { Session } from "inspector";
import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "../../utils/api";
import { useRouter } from "next/router";

export default function Role() {
  const router = useRouter();
  const { name } = router.query;
  const { data: session } = useSession();

  if (!session) return <div>not signed in </div>;

  return (
    <div>
      <div>{name}</div>
      <RoleInfo session={session} name={name} />
    </div>
  );
}

const RoleInfo = ({ session, name }) => {
  if (!session) return <div></div>;

  const { data: user } = api.example.getRoleAlt.useQuery(
    { name: name },
    { enabled: session?.user !== undefined }
  );

  if (!user || user.roles.length == 0) return <div></div>;

  return (
    <>
      <div>{JSON.stringify(user.roles[0])}</div>
    </>
  );

  return <div>end</div>;
};
