import { LessonKey, LessonKeys } from "@keybr/lesson";
import { Letter } from "@keybr/phonetic-model";
import { letters } from "./english.ts";

export function makeExampleLesson(
  confidences: readonly (number | null)[],
): LessonKeys {
  const keys: LessonKey[] = [];

  let index = 0;
  for (const letter of Letter.frequencyOrder(letters)) {
    if (index < confidences.length) {
      const confidence = confidences[index];
      keys.push(
        new LessonKey({
          letter,
          samples: [],
          timeToType: null,
          bestTimeToType: null,
          confidence: confidence,
          bestConfidence: confidence,
        }).asIncluded(),
      );
    } else {
      keys.push(
        new LessonKey({
          letter,
          samples: [],
          timeToType: null,
          bestTimeToType: null,
          confidence: null,
          bestConfidence: null,
        }).asExcluded(),
      );
    }
    index += 1;
  }

  const lessonKeys = new LessonKeys(keys);

  // Find all included keys below the target speed and focus on them.
  const candidateKeys = lessonKeys
    .findIncludedKeys()
    .filter((key) => (key.confidence ?? 0) < 1);
  for (const key of candidateKeys) {
    lessonKeys.focus(key.letter);
  }

  return lessonKeys;
}
