/* eslint-disable @typescript-eslint/no-unsafe-call */
// route.ts
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "~/app/api/auth/[...nextauth]/handler"; // Import handler

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return handler(req, res); // Call handler in GET method
}

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return handler(req, res); // Call handler in POST method
}
