import firstChapter from "./chapter-1";
import secondChapter from "./chapter-2";
import thirdChapter from "./chapter-3";
import fourthChapter from "./chapter-4";

export const chapters = withStepIndex([
  firstChapter,
  secondChapter,
  thirdChapter,
  fourthChapter,
]);

export const allSteps = chapters.reduce((acc, chapter) => {
  return acc.concat(chapter.content.filter((child) => child.type === "step"));
}, []);

function withStepIndex(chapters) {
  let stepIndex = 0;
  return chapters.map((chapter, chapterIndex) => {
    const startAtIndex = stepIndex;
    const content = chapter.content.map((child) =>
      child.type === "step"
        ? { ...child, stepIndex: stepIndex++, chapterIndex }
        : child
    );
    const stepCount = stepIndex - startAtIndex;

    return {
      ...chapter,
      startAtIndex,
      content,
      stepCount,
    };
  });
}
