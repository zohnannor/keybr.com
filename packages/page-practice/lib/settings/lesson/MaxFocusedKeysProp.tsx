import { lessonProps } from "@keybr/lesson";
import { useSettings } from "@keybr/settings";
import {
  Description,
  Explainer,
  Field,
  FieldList,
  Range,
  Value,
} from "@keybr/widget";
import { type ReactNode } from "react";
import { FormattedMessage } from "react-intl";

export function MaxFocusedKeysProp(): ReactNode {
  const { settings, updateSettings } = useSettings();
  return (
    <>
      <FieldList>
        <Field>
          <FormattedMessage
            id="t_Max_focused_keys:"
            defaultMessage="Max targeted keys:"
          />
        </Field>
        <Field>
          <Range
            min={lessonProps.guided.maxFocusedKeys.min}
            max={lessonProps.guided.maxFocusedKeys.max}
            step={1}
            value={settings.get(lessonProps.guided.maxFocusedKeys)}
            onChange={(value) => {
              updateSettings(
                settings.set(lessonProps.guided.maxFocusedKeys, value),
              );
            }}
          />
        </Field>
        <Field>
          <Value value={settings.get(lessonProps.guided.maxFocusedKeys)} />
        </Field>
      </FieldList>
      <Explainer>
        <Description>
          <FormattedMessage
            id="settings.maxFocusedKeys.description"
            defaultMessage="Limit the number of keys simultaneously targeted for practice. Setting this to 1 will focus on the single weakest key at a time."
          />
        </Description>
      </Explainer>
    </>
  );
}
