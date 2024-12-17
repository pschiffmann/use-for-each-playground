type Modifier = string | false | null | undefined;

export interface BemClasses {
  block(external?: string | null, ...modifiers: readonly Modifier[]): string;
  element(
    element: string,
    external?: string | null,
    ...modifiers: readonly Modifier[]
  ): string;
}

export function bemClasses(block: string): BemClasses {
  return {
    block(external, ...modifiers) {
      let result = external ? `${external} ${block}` : block;
      for (const modifier of modifiers) {
        if (modifier) result += ` ${block}--${modifier}`;
      }
      return result;
    },
    element(element, external, ...modifiers) {
      let result = external
        ? `${external} ${block}__${element}`
        : `${block}__${element}`;
      for (const modifier of modifiers) {
        if (modifier) result += ` ${block}__${element}--${modifier}`;
      }
      return result;
    },
  };
}
