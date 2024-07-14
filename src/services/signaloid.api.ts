import axios from "axios";
import { SourceCodeTaskRequest } from "../types";

const apiToken = import.meta.env.VITE_API_TOKEN;

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

export async function extractValueIDTags(taskOutput: string) {
  const regex = /<ValueID>(.*?)<\/ValueID>/g;
  return [...taskOutput.matchAll(regex)].map((m) => ({
    valueID: m[1],
  }));
}

export const getSamplesFromTask = async (taskID: string, valueID: string) => {
  try {
    const response = await signaloidClient.get(
      `/tasks/${taskID}/values/${valueID}/samples`,
      {
        params: { count: 10 },
      }
    );
    if (response.data) {
      console.log(`Samples: `, response.data.Samples);
    }
  } catch (error) {
    console.log("Error:", error);
  }
};

export async function parseOutputAndGetSamples(
  taskStdout: string,
  taskID: string
) {
  if (taskStdout) {
    const values = await extractValueIDTags(taskStdout);
    const sigmaCMpa_valueID = values[values.length - 1].valueID;

    if (sigmaCMpa_valueID) {
      console.log(
        `Generating samples from the distribution with valueID: ${sigmaCMpa_valueID}`
      );
      await getSamplesFromTask(taskID, sigmaCMpa_valueID);
    }
  } else {
    setTimeout(async () => {
      await parseOutputAndGetSamples(taskStdout, taskID);
    }, 1000);
  }
}
