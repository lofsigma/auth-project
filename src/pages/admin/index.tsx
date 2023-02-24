import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { api } from "../../utils/api";
import { useForm } from "react-hook-form";
import { Session } from "next-auth";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";

export default function Admin() {
  // Session.
  const { data: session, status } = useSession();

  // Form.
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  // New user username + password
  const [newPass, setNewPass] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [currDrag, setCurrDrag] = useState("");

  // New User Mutation.
  const mutation = api.example.createNewUser.useMutation();

  // Create new user.
  const createUser = (data) =>
    mutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: new Date(data.birthDate),
      newHire: data.newHire === "true",
      managerId: data.managerId,
      personnelArea: data.personnelArea,
      department: data.department,
      costCenter: data.costCenter,
      roles: data.roles,
    });

  const { data: isAdmin } = api.example.isAdmin.useQuery(
    { id: session?.user.id }, // no input
    { enabled: session?.user !== undefined }
  );

  if (status === "loading") {
    return <p>...</p>;
  }

  if (status === "unauthenticated") {
    return <p>Access Denied</p>;
  }

  if (!Admin) return <div>...</div>;

  return (
    <div>
      <div className="mt-8 mb-8 flex items-center justify-between">
        <div className="text-medium uppercase">admin</div>
        <button
          onClick={signOut}
          className="w-fit rounded-md bg-gray-100 px-4 py-2 hover:bg-black hover:text-white"
        >
          logout
        </button>
      </div>
      <Users session={session} setCurrDrag={setCurrDrag} />
      <Roles currDrag={currDrag} setCurrDrag={setCurrDrag} />
      <div className="mt-8 mb-4 text-center">NEW USER</div>
      <form onSubmit={handleSubmit(createUser)} className="flex flex-col">
        <label>FIRST NAME</label>
        <input
          className="mt-2  mb-4 bg-gray-100 px-4 py-2"
          placeholder="FIRST NAME"
          {...register("firstName")}
        />
        <label>LAST NAME</label>
        <input
          className="mt-2  mb-4 bg-gray-100 px-4 py-2"
          placeholder="LAST NAME"
          {...register("lastName")}
        />
        <label>BIRTH DATE</label>
        <input
          className="mt-2  mb-4 bg-gray-100 px-4 py-2"
          placeholder="BIRTH DATE"
          {...register("birthDate")}
        />
        <label>NEW HIRE</label>
        <input
          className="mt-2  mb-4 bg-gray-100 px-4 py-2"
          placeholder="NEW HIRE"
          {...register("newHire")}
        />
        <label>MANAGER ID</label>
        <input
          className="mt-2  mb-4 bg-gray-100 px-4 py-2"
          placeholder="MANAGER ID"
          {...register("managerId")}
        />
        <label>PERSONNEL AREA</label>
        <input
          className="mt-2  mb-4 bg-gray-100 px-4 py-2"
          placeholder="PERSONNEL AREA"
          {...register("personnelArea")}
        />
        <label>DEPARTMENT</label>
        <input
          className="mt-2  mb-4 bg-gray-100 px-4 py-2"
          placeholder="DEPARTMENT"
          {...register("department")}
        />
        <label>COST CENTER</label>
        <input
          className="mt-2  mb-4 bg-gray-100 px-4 py-2"
          placeholder="COST CENTER"
          {...register("costCenter")}
        />
        <label>ROLES</label>
        <input
          className="mt-2  mb-4 bg-gray-100 px-4 py-2"
          placeholder="ROLES"
          {...register("roles")}
        />
        <button className="mb-4 bg-orange-400 px-4 py-2">SUBMIT</button>
      </form>

      <div className="w-50 mb-8 border p-4">
        <div className="">NEW USER</div>
        <div>
          USERNAME:{" "}
          {mutation.isSuccess ? mutation.data.user.userName : "loading"}
        </div>
        <div>
          PASSWORD: {mutation.isSuccess ? mutation.data.pass : "loading"}
        </div>
      </div>
      <div>MISSING</div>
      <ul className="uppercase">
        <li>send email on new user with username + password</li>
        <li>assign roles using ml magic</li>
        <li className="line-through">
          actually enforce passwords, need to figure out how to save password
          before hashing.
        </li>
        <li>set username color based on associated roles</li>
        <li>webauthn</li>
        <li>encrypt data at rest.</li>
        <li>fix mobile</li>
      </ul>
    </div>
  );
}

const Users: React.FC = ({
  session,
  setCurrDrag,
}: {
  session: Session;
  setCurrDrag: any;
}) => {
  // const { data: session } = useSession();

  const { data: users } = api.example.getAllUsers.useQuery(
    undefined, // no input
    { enabled: session?.user !== undefined }
  );

  return (
    <>
      <div className="mb-4 mt-8 text-center">USERS</div>
      <table className="w-full uppercase leading-10">
        <thead>
          <tr className="border-b border-gray-300 text-left">
            <th className="font-normal">USERNAME</th>
            <th className="font-normal">ROLES</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.userName} className="border-b border-gray-200">
              <td>
                <div
                  draggable={true}
                  className="w-fit cursor-move touch-none bg-orange-200/20 px-2 uppercase"
                  onDragStart={(event) => {
                    setCurrDrag(user.id);
                  }}
                >
                  {user.userName}
                </div>
              </td>
              <td>
                {user.roles.map(({ name }) => (
                  <div key={user.userName + name}>{name}</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const colors = ["border-orange-400", "border-purple-400", "border-brown-400"];

const colors2 = ["bg-orange-400/10", "bg-purple-400/10", "bg-brown-400/10"];

const Roles: React.FC = ({ currDrag, setCurrDrag }) => {
  const { data: session } = useSession();
  const [currRole, setCurrRole] = useState("");

  const { data: roles } = api.example.getAllRoles.useQuery(
    undefined, // no input
    { enabled: session?.user !== undefined }
  );

  const mutationAddRole = api.example.addRole.useMutation();
  const mutationRemoveRole = api.example.removeRole.useMutation();

  const springs = useSpring(() => ({ x: 0, y: 0 }));
  const { x, y } = springs[0];
  const api2 = springs[1];

  // Set the drag hook and define component movement based on gesture data
  const bind = useDrag(({ down, movement: [mx, my] }) => {
    api2.start({ x: down ? mx : 0, y: down ? my : 0, immediate: down });
  });

  const handleDrop = (event) => {
    event.stopPropagation();
    const elem = event.target;
    // console.log("dropped", elem, "dragged", currDrag);
    mutationAddRole.mutate({
      id: currDrag,
      role: elem.textContent,
    });

    console.log("handle", mutationAddRole.data);
    // addRole to user
  };

  const handleGarbage = (event) => {
    event.stopPropagation();
    // console.log("garbage!");
    const elem = event.target;
    console.log("dropped");
    mutationRemoveRole.mutate({
      id: currDrag,
      role: currRole,
    });
  };

  return (
    <>
      <div
        onDrop={handleGarbage}
        onDragOver={(event) => event.preventDefault()}
        className="float-right mt-4 block p-4"
      >
        🗑️
      </div>
      <div className="mb-4 mt-8 text-center">ROLES</div>
      <div className="grid gap-4">
        {roles &&
          roles.map(({ name, users }, i) => (
            <div
              key={name}
              className={`border-2 ${colors[i]} p-2`}
              onDrop={handleDrop}
              onDragOver={(event) => event.preventDefault()}
            >
              <div className="pb-4 uppercase">{name}</div>
              {users.map((user) => (
                <div
                  key={name + user.userName}
                  className={`my-2  w-fit cursor-pointer px-2 py-1 uppercase ${colors2[i]}`}
                  draggable={true}
                  onDragStart={(event) => {
                    setCurrDrag(user.id);
                    console.log(name);
                    setCurrRole(name);
                  }}
                >
                  {user.userName}
                </div>
              ))}
            </div>
          ))}
      </div>
    </>
  );
};
