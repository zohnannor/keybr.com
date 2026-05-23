import {
  type CodePoint,
  type CodePointSet,
  type HasCodePoint,
} from "@keybr/unicode";
import { Letter, type LetterLike } from "./letter.ts";

export class Filter {
  static readonly empty = new Filter(null, null);

  /**
   * Codepoints of the letters from which to generate words.
   */
  readonly codePoints: CodePointSet | null;
  /**
   * Codepoints of the letters which must appear in each generated word.
   */
  readonly focusedCodePoints: readonly CodePoint[] | null;

  constructor(
    letters0: readonly LetterLike[] | null = null,
    focused0: readonly LetterLike[] | LetterLike | null = null,
  ) {
    const letters = letters0 && letters0.map(Letter.toLetter);
    const focused = normalizeFocused(focused0);
    if (letters != null && letters.length === 0) {
      throw new Error();
    }
    if (
      letters != null &&
      focused != null &&
      !focused.every((f) => letters.includes(f))
    ) {
      throw new Error();
    }
    this.codePoints = letters && new Set(letters.map(codePointOf));
    this.focusedCodePoints =
      focused != null && focused.length > 0 ? focused.map(codePointOf) : null;
  }

  /**
   * Returns a value indicating whether the given codepoint
   * is allowed by this filter.
   *
   * Empty filter allows all characters.
   */
  includes(codePoint: CodePoint): boolean {
    return this.codePoints == null || this.codePoints.has(codePoint);
  }
}

function normalizeFocused(
  focused0: readonly LetterLike[] | LetterLike | null,
): readonly Letter[] | null {
  if (focused0 == null) {
    return null;
  }
  if (Array.isArray(focused0)) {
    return focused0.map(Letter.toLetter);
  }
  return [Letter.toLetter(focused0 as LetterLike)];
}

const codePointOf = ({ codePoint }: HasCodePoint): CodePoint => {
  return codePoint;
};
