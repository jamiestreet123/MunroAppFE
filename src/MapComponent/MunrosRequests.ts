import fetch from 'node-fetch';
import { MunroCoord } from './MapComponent';

type GetMunrosResponse = {
  data: MunroCoord[];
};

export async function getMunros() {
  try {
    // 👇️ const response: Response
    const response = await fetch('http://localhost:8000/api/munros', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error! status: ${response.status}`);
    }

    // 👇️ const result: GetUsersResponse
    const result = (await response.json()) as GetMunrosResponse;

    console.log('result is: ', JSON.stringify(result, null, 4));

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      console.log('error message: ', error.message);
      return [] as MunroCoord[];
    } else {
      console.log('unexpected error: ', error);
      return [] as MunroCoord[];
    }
  }
}