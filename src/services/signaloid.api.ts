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

export const analyzeWithSignaloid = async (payload: SourceCodeTaskRequest) => {
  try {
    const taskPostResponse = await signaloidClient.post("/tasks", payload);
    const taskID = taskPostResponse.data.TaskID;

    if (taskID) {
      console.log(`...task successfully created with ID: ${taskID}`);
    }

    let taskStatus = taskPostResponse.data.Status;
    let result;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    while (![`Completed`, `Cancelled`, `Stopped`].includes(taskStatus)) {
      await delay(5000);
      try {
        const taskGetResponse = await signaloidClient.get(`/tasks/${taskID}`);
        taskStatus = taskGetResponse.data.Status;
        console.log(`...task status : ${taskStatus}`);

        if (taskStatus === "Completed") {
          try {
            const taskOutputsResponse = await signaloidClient.get(
              `/tasks/${taskID}/outputs?sanitized=false`
            );
            console.log("Task Outputs Response:", taskOutputsResponse.data);

            if (taskOutputsResponse.data.Stdout) {
              console.log("Task Output URL:", taskOutputsResponse.data.Stdout);
              try {
                const outputStream = await axios.get(
                  taskOutputsResponse.data.Stdout
                );
                result = outputStream.data;
              } catch (error: any) {
                console.error("Error fetching task output:", error.message);
                throw new Error("Error fetching task output");
              }
            }
          } catch (error: any) {
            console.error("Error fetching task outputs:", error.message);
            throw new Error("Error fetching task outputs");
          }
        }
      } catch (error: any) {
        console.error("Error fetching task status:", error.message);
        throw new Error("Error fetching task status");
      }
    }

    if (result) {
      const uxStrings = extractUxStringValues(result);
      if (uxStrings.length > 0) {
        const latestUxString = uxStrings[uxStrings.length - 1].uxString;
        console.log(`Extracted UxString: ${latestUxString}`);
        const plotUrl = await getPlotFromUXString(latestUxString);
        return plotUrl;
      } else {
        throw new Error("No UxString found in the task output");
      }
    } else {
      throw new Error("No result found in the task output");
    }
  } catch (error: any) {
    console.error("General Error:", error.message);
    throw error;
  }
};

export function extractUxStringValues(taskOutput: string) {
  const regex =
    /([-+]?(?:\d+\.\d*|\.\d+)(?:[eE][-+]?\d+)?)(Ux[0-9a-fA-F]{40,})/g;
  const matches = [...taskOutput.matchAll(regex)];
  if (matches.length === 0) {
    throw new Error("Error extracting UXstring");
  }
  console.log("Regex Matches:", matches);
  return matches.map((m) => ({
    value: m[1],
    uxString: m[2],
  }));
}

export async function getPlotFromUXString(uxString: string) {
  try {
    const response = await signaloidClient.post(`/plot`, { payload: uxString });
    if (response.status !== 201) {
      throw new Error(
        `Network response was not ok, status: ${response.status}`
      );
    }
    return response.data.presignedURL;
  } catch (error) {
    console.error("Error getting plot from UxString:", error);
    throw error;
  }
}
