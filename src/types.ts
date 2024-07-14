export type TraceVariable = {
  File: string;
  LineNumber: number;
  Expression: string;
};

export type SourceCodeTaskRequest = {
  Type: "SourceCode";
  SourceCode: {
    Object: "SourceCode";
    Code: string;
    Arguments: string;
    Language: "C" | "C++";
  };
  Overrides?: {
    Core?: string;
    TraceVariables?: TraceVariable[];
  };
};
