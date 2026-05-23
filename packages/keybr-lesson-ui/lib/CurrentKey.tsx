import { type LessonKey, type LessonKeys } from "@keybr/lesson";
import { type ClassName, styleTextTruncate } from "@keybr/widget";
import { FormattedMessage } from "react-intl";
import { Key } from "./Key.tsx";
import { KeyDetails } from "./KeyDetails.tsx";

export const CurrentKey = ({
  id,
  className,
  lessonKeys,
  onKeyHoverIn,
  onKeyHoverOut,
}: {
  id?: string;
  className?: ClassName;
  lessonKeys: LessonKeys;
  onKeyHoverIn?: (key: LessonKey, elem: Element) => void;
  onKeyHoverOut?: (key: LessonKey, elem: Element) => void;
}) => {
  const focusedKeys = lessonKeys.findFocusedKeys();
  const focusedKey = focusedKeys[0] ?? null;
  return (
    <span id={id} className={className}>
      {focusedKey != null ? (
        <span
          style={{
            display: "inline-flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <span
            style={{ display: "inline-flex", gap: 2, alignItems: "center" }}
          >
            {focusedKeys.map((key) => (
              <Key
                key={key.letter.codePoint}
                lessonKey={key}
                onMouseOver={(e) => {
                  const k = Key.attached(e.currentTarget);
                  if (k != null) onKeyHoverIn?.(k, e.currentTarget);
                }}
                onMouseOut={(e) => {
                  const k = Key.attached(e.currentTarget);
                  if (k != null) onKeyHoverOut?.(k, e.currentTarget);
                }}
              />
            ))}
          </span>
          <KeyDetails lessonKey={focusedKey} />
        </span>
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
