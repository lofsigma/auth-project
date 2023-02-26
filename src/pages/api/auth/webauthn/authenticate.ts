import { NextApiRequest, NextApiResponse } from "next";

export default async function WebauthnAuthenticate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const username = req.query["username"] as string;
  if (!username) {
    return res.status(400).json({ message: "username is required." });
  }
  const db = await getDb(dbName);
  const credentials = await db
    .collection<DbCredential>("credentials")
    .find({
      userID: email,
    })
    .toArray();
  const options = generateAuthenticationOptions({
    userVerification: "preferred",
  });

  options.allowCredentials = credentials.map((c) => ({
    id: c.credentialID,
    type: "public-key",
    transports: c.transports,
  }));
  try {
    await saveChallenge({ userID: email, challenge: options.challenge });
  } catch (err) {
    return res.status(500).json({ message: "Could not set up challenge." });
  }
  return res.status(200).json(options);
}
