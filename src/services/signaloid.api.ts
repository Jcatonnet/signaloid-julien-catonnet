import axios from "axios";
import { SourceCodeTaskRequest } from "../types";
const apiToken =
  "scce_923fb35a08b54da48cdb58d4e3aa13a2d92657896a5941b38163f2b6a1139528_cc3900f7";

const signaloidClient = axios.create({
  baseURL: "https://api.signaloid.io",
  headers: {
    Authorization: apiToken,
    "Content-Type": "application/json",
  },
});

export async function createTask(payload: SourceCodeTaskRequest) {
  const response = await signaloidClient.post("/tasks", payload);

  if (response.status !== 202) {
    throw new Error(`Network response was not ok, status: ${response.status}`);
  }

  return response.data;
}

export async function getTaskStatus(taskID: string) {
  const response = await signaloidClient.get(`/tasks/${taskID}`);

  if (response.status !== 200) {
    throw new Error(`Network response was not ok, status: ${response.status}`);
  }

  return response.data;
}

export async function getTaskOutputs(taskID: string) {
  console.log("Fetching task outputs...");
  try {
    const response = await signaloidClient.get(
      `/tasks/${taskID}/outputs?sanitized=false`
    );

    if (response.status !== 200) {
      throw new Error(
        `Network response was not ok, status: ${response.status}`
      );
    }

    const taskOutputsResponse = response.data;
    if (taskOutputsResponse.Stdout) {
      const outputStream = await axios.get(taskOutputsResponse.Stdout);
      const taskStdout = outputStream.data;
      console.log(`Task Stdout: \n${taskStdout}`);
      return { Stdout: taskStdout };
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function extractUxStringValues(taskOutput: string) {
  const regex =
    /([-+]?(?:\d+\.\d*|\.\d+)(?:[eE][-+]?\d+)?)(Ux[0-9a-fA-F]{40,})/g;
  return [...taskOutput.matchAll(regex)].map((m) => ({
    value: m[1],
    uxString: m[2],
  }));
}

export async function getSamplesFromUxString(uxString: string) {
  try {
    const response = await signaloidClient.post(`/plot`, { payload: uxString });

    console.log("response", response);

    if (response.status !== 201) {
      throw new Error(
        `Network response was not ok, status: ${response.status}`
      );
    }

    const sampleData = response.data;
    return sampleData.presignedURL;
  } catch (error) {
    console.error("Error getting samples from Ux string:", error);
  }
}
