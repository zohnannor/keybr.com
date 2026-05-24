import { Layout } from "@keybr/keyboard";
import { isPlainObject, isString } from "@keybr/lang";
import { Result, TextType, useResults } from "@keybr/result";
import { Histogram } from "@keybr/textinput";
import { Button, Field, FieldList, Icon } from "@keybr/widget";
import { mdiDeleteForever, mdiDownload, mdiUpload } from "@mdi/js";
import { useIntl } from "react-intl";

export function FooterSection() {
  const { formatMessage } = useIntl();
  const { handleDownloadData, handleImportData, handleResetData } =
    useCommands();

  return (
    <FieldList>
      <Field>
        <Button
          size={16}
          icon={<Icon shape={mdiDownload} />}
          label={formatMessage({
            id: "t_Download_data",
            defaultMessage: "Download data",
          })}
          title={formatMessage({
            id: "profile.download.description",
            defaultMessage: "Download all your typing data in JSON format.",
          })}
          onClick={() => {
            handleDownloadData();
          }}
        />
      </Field>
      <Field>
        <Button
          size={16}
          icon={<Icon shape={mdiUpload} />}
          label={formatMessage({
            id: "t_Import_data",
            defaultMessage: "Import data",
          })}
          title={formatMessage({
            id: "profile.import.description",
            defaultMessage:
              "Import typing data from a previously exported JSON file.",
          })}
          onClick={() => {
            handleImportData();
          }}
        />
      </Field>
      <Field.Filler />
      <Field>
        <Button
          size={16}
          icon={<Icon shape={mdiDeleteForever} />}
          label={formatMessage({
            id: "t_Reset_statistics",
            defaultMessage: "Reset statistics",
          })}
          title={formatMessage({
            id: "profile.reset.description",
            defaultMessage:
              "Permanently delete all of your typing data and reset statistics.",
          })}
          onClick={() => {
            handleResetData();
          }}
        />
      </Field>
    </FieldList>
  );
}

function useCommands() {
  const { formatMessage } = useIntl();
  const { results, appendResults, clearResults } = useResults();
  return {
    handleDownloadData: () => {
      const json = JSON.stringify(results);
      const blob = new Blob([json], { type: "application/json" });
      download(blob, "typing-data.json");
    },
    handleResetData: () => {
      const message = formatMessage({
        id: "profile.reset.message",
        defaultMessage:
          "Are you sure you want to delete all data and reset your profile? " +
          "This operation is permanent and cannot be undone!",
      });
      if (window.confirm(message)) {
        clearResults();
      }
    },
    handleImportData: () => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", ".json");
      input.setAttribute("hidden", "");
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (file == null) return;
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          const text = reader.result;
          if (typeof text !== "string") return;
          try {
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed)) {
              throw new Error("Expected a JSON array");
            }
            const results = parsed
              .map((item) => resultFromExportJson(item))
              .filter((r): r is Result => r != null);
            if (results.length === 0) {
              throw new Error("No valid results found in file");
            }
            appendResults(results);
          } catch (err) {
            alert(
              "Failed to import data: " +
                (err instanceof Error ? err.message : String(err)),
            );
          }
        });
        reader.readAsText(file);
      });
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    },
  };
}

export type ResultJson = {
  readonly layout: string;
  readonly textType: string;
  readonly timeStamp: string;
  readonly length: number;
  readonly time: number;
  readonly errors: number;
  readonly histogram: readonly {
    readonly codePoint: number;
    readonly hitCount: number;
    readonly missCount: number;
    readonly timeToType: number;
  }[];
};

function resultFromExportJson(json: unknown): Result | null {
  if (!isPlainObject(json)) {
    return null;
  }
  const {
    layout: layoutId,
    textType: textTypeId,
    timeStamp,
    length,
    time,
    errors,
    histogram: histogramRaw,
  } = json as Record<string, unknown>;
  if (
    !(
      isString(layoutId) &&
      isString(textTypeId) &&
      (isString(timeStamp) || typeof timeStamp === "number") &&
      typeof length === "number" &&
      typeof time === "number" &&
      typeof errors === "number" &&
      Array.isArray(histogramRaw)
    )
  ) {
    return null;
  }
  const samples = [];
  for (const sample of histogramRaw) {
    if (!isPlainObject(sample)) return null;
    const { codePoint, hitCount, missCount, timeToType } = sample as Record<
      string,
      unknown
    >;
    if (
      !(
        typeof codePoint === "number" &&
        typeof hitCount === "number" &&
        typeof missCount === "number" &&
        typeof timeToType === "number"
      )
    ) {
      return null;
    }
    samples.push({ codePoint, hitCount, missCount, timeToType });
  }
  try {
    return new Result(
      Layout.ALL.get(layoutId),
      TextType.ALL.get(textTypeId),
      new Date(timeStamp).getTime(),
      length,
      time,
      errors,
      new Histogram(samples),
    );
  } catch {
    return null;
  }
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.setAttribute("href", URL.createObjectURL(blob));
  a.setAttribute("download", name);
  a.setAttribute("hidden", "");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
