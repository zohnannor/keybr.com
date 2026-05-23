import { type LessonKeys } from "@keybr/lesson";
import { type ClassName, styleTextTruncate } from "@keybr/widget";
import { FormattedMessage } from "react-intl";
import { Key } from "./Key.tsx";
import { KeyDetails } from "./KeyDetails.tsx";

export const CurrentKey = ({
  id,
  className,
  lessonKeys,
}: {
  id?: string;
  className?: ClassName;
  lessonKeys: LessonKeys;
}) => {
  const focusedKeys = lessonKeys.findFocusedKeys();
  const focusedKey = focusedKeys[0] ?? null;
  return (
    <span id={id} className={className}>
      {focusedKey != null ? (
        <>
          <span
            style={{ display: "inline-flex", gap: 2, alignItems: "center" }}
          >
            {focusedKeys.map((key) => (
              <Key key={key.letter.codePoint} lessonKey={key} />
            ))}
          </span>
          <KeyDetails lessonKey={focusedKey} />
        </>
      ) : (
        <span className={styleTextTruncate}>
          <FormattedMessage
            id="t_All_keys_are_unlocked"
            defaultMessage="All keys are unlocked."
          />
        </span>
      )}
    </span>
  );
};
