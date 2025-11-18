import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs";
import path from "path";


async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER) return res.status(200).json([]);

  const dir = fs.readdirSync(process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER ?? '');
  console.log(dir);

  return res.status(200).json({ functions: dir.filter(dir => dir !== "main") })
}

export default handler;
