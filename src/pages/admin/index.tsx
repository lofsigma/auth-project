import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from 'react';
import { api } from "../../utils/api";
import { useForm } from "react-hook-form";
import { Session } from "next-auth";
import { useSpring, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

export default function Admin() {
  // Session.
  const { data: session, status } = useSession();

  // Form.
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  // New user username + password 
  const [newPass, setNewPass] = useState('');
  const [newUserName, setNewUserName] = useState('');

  // New User Mutation.
  const mutation = api.example.createNewUser.useMutation();

  // Create new user.
  const createUser = async (data) => {
    mutation.mutate(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: new Date(data.birthDate),
        newHire: data.newHire === 'true',
        managerId: data.managerId,
        personnelArea: data.personnelArea,
        department: data.department,
        costCenter: data.costCenter,
        roles: data.roles
      }
    )
    console.log('new user', mutation.data);
  };


  const { data: isAdmin } = api.example.isAdmin.useQuery(
    { id: session?.user.id }, // no input
    { enabled: session?.user !== undefined }
  );

  if (status === "loading") {
    return <p>Loading...</p>
  }

  if (status === "unauthenticated") {
    return <p>Access Denied</p>
  }

  if (isAdmin) {
    return (
      <div>
        <div className="text-xl mt-8">ADMIN</div>
        <Users session={session} />
        <Roles />
        <div className="mt-8 mb-4 text-center">NEW USER</div>
        <form onSubmit={handleSubmit(createUser)} className="flex flex-col">
          <label>FIRST NAME</label>
          <input className="bg-gray-100  px-4 py-2 mt-2 mb-4" placeholder="FIRST NAME"  {...register("firstName")} />
          <label>LAST NAME</label>
          <input className="bg-gray-100  px-4 py-2 mt-2 mb-4" placeholder="LAST NAME" {...register("lastName")} />
          <label>BIRTH DATE</label>
          <input className="bg-gray-100  px-4 py-2 mt-2 mb-4" placeholder="BIRTH DATE" {...register("birthDate")} />
          <label>NEW HIRE</label>
          <input className="bg-gray-100  px-4 py-2 mt-2 mb-4" placeholder="NEW HIRE" {...register("newHire")} />
          <label>MANAGER ID</label>
          <input className="bg-gray-100  px-4 py-2 mt-2 mb-4" placeholder="MANAGER ID" {...register("managerId")} />
          <label>PERSONNEL AREA</label>
          <input className="bg-gray-100  px-4 py-2 mt-2 mb-4" placeholder="PERSONNEL AREA" {...register("personnelArea")} />
          <label>DEPARTMENT</label>
          <input className="bg-gray-100  px-4 py-2 mt-2 mb-4" placeholder="DEPARTMENT" {...register("department")} />
          <label>COST CENTER</label>
          <input className="bg-gray-100  px-4 py-2 mt-2 mb-4" placeholder="COST CENTER" {...register("costCenter")} />
          <label>ROLES</label>
          <input className="bg-gray-100  px-4 py-2 mt-2 mb-4" placeholder="ROLES" {...register("roles")} />
          <button className="bg-orange-400 px-4 py-2 mb-4">SUBMIT</button>
        </form>

        <div className="p-4 border w-50 mb-8">
          <div className="">NEW USER</div>
          <div>USERNAME: {mutation.isSuccess ? mutation.data.userName : 'loading'}</div>
          <div>PASSWORD: {mutation.isSuccess ? mutation.data.password : 'loading'}</div>
        </div>
        <div>MISSING</div>
        <div>SEND EMAIL ON SUBMIT TO ADMIN WITH USERNAME + PASSWORD</div>
        <div>make usernames draggable, and associate a db action.</div>
      </div>
    );
  } else {
    return <div>you are not an admin {JSON.stringify(isAdmin)}</div>;
  }
}

const Users: React.FC = ({ session }: { session: Session }) => {
  // const { data: session } = useSession();

  const { data: users } = api.example.getAllUsers.useQuery(
    undefined, // no input
    { enabled: session?.user !== undefined }
  );

  return (
    <>
      <div className="mb-4 mt-8 text-center">USERS</div>
      <table className="leading-10 w-full">
        <thead>
          <tr className="border-b border-gray-300 text-left">
            <th className="font-normal">USERNAME</th>
            <th className="font-normal">ROLES</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr className="border-b border-gray-200">
              <td>{user.userName}</td>
              <td>{user.roles.map(({ name }) => <div>{name}</div>)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const colors = [
  'border-orange-400',
  'border-purple-400',
  'border-brown-400'
]

const colors2 = [
  'bg-orange-400/10',
  'bg-purple-400/10',
  'bg-brown-400/10'
]

const Roles: React.FC = () => {
  const { data: session } = useSession();

  const { data: roles } = api.example.getAllRoles.useQuery(
    undefined, // no input
    { enabled: session?.user !== undefined }
  );

  const springs = useSpring(() => ({ x: 0, y: 0 }))
  const { x, y } = springs[0];
  const api2 = springs[1];

  // Set the drag hook and define component movement based on gesture data
  const bind = useDrag(({ down, movement: [mx, my] }) => {
    api2.start({ x: down ? mx : 0, y: down ? my : 0, immediate: down })
  })

  return (
    <>
      <div className="mb-4 mt-8 text-center">ROLES</div>
      <div className="grid gap-4">
        {roles &&
          roles.map(({ name, users }, i) => (
            <div className={`border-2 ${colors[i]} p-2`}>
              <div className="pb-4 uppercase">{name}</div>
              {users.map((user) => (
                <animated.div className={`w-fit  px-2 py-1 uppercase cursor-pointer ${colors2[i]}`}>{user.userName}</animated.div>
              ))}
            </div>
          ))}
      </div>
    </>
  );
};
