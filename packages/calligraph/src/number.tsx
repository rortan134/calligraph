import type { Transition } from "motion/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useState } from "react";
import { reconcileDigitKeys } from "./reconcile";
import { DIGIT_DISTANCE, isDigit, splitGraphemes } from "./shared";

export function NumberRenderer({
  text,
  transition,
  stagger,
  animateInitial,
  onComplete,
}: {
  text: string;
  transition: Transition;
  stagger: number;
  animateInitial: boolean;
  onComplete?: () => void;
}) {
  const chars = splitGraphemes(text);

  const [nextId, setNextId] = useState(chars.length);
  const [prevText, setPrevText] = useState(text);
  const [digitKeys, setDigitKeys] = useState<number[]>(() =>
    chars.map((_, i) => i),
  );
  const [direction, setDirection] = useState(1);

  if (text !== prevText) {
    const result = reconcileDigitKeys(prevText,
        text,
        digitKeys,
        nextId
    );
    setNextId(result.nextId);
    setDirection(result.direction);
    setDigitKeys(result.keys);
    setPrevText(text);
  }

  const prefixLen = (() => {
    const idx = chars.findIndex((c) => isDigit(c));
    return idx === -1 ? chars.length : idx;
  })();

  return (
    <MotionConfig transition={transition}>
      <AnimatePresence mode="popLayout" initial={animateInitial}>
        {chars.map((char, i) => {
          const isPrefix = i < prefixLen;
          const outerKey = isPrefix
            ? `pre-${i}`
            : `col-${chars.length - 1 - i}`;
          const delay = i * stagger;
          const isLast = i === chars.length - 1;

          return (
            <motion.span
              key={outerKey}
              layout="position"
              initial={isPrefix ? false : { opacity: 0 }}
              animate={isPrefix ? undefined : { opacity: 1 }}
              exit={isPrefix ? undefined : { opacity: 0 }}
              style={{ display: "inline-block", position: "relative" }}
            >
              {isPrefix ? (
                <span style={{ display: "inline-block", whiteSpace: "pre" }}>
                  {char}
                </span>
              ) : (
                <AnimatePresence
                  mode="popLayout"
                  initial={animateInitial}
                  propagate
                >
                  <motion.span
                    key={digitKeys[i]}
                    aria-hidden="true"
                    initial={{
                      y: isDigit(char)
                        ? direction > 0
                          ? DIGIT_DISTANCE
                          : -DIGIT_DISTANCE
                        : 0,
                      filter: "blur(2px)",
                      scale: 0.5,
                      opacity: 0,
                    }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      filter: "blur(0px)",
                      scale: 1,
                      transition: { delay },
                    }}
                    exit={{
                      y: isDigit(char)
                        ? direction > 0
                          ? -DIGIT_DISTANCE
                          : DIGIT_DISTANCE
                        : 0,
                      opacity: 0,
                      filter: "blur(2px)",
                      scale: 0.5,
                      transition: { delay },
                    }}
                    onAnimationComplete={
                      isLast && onComplete ? onComplete : undefined
                    }
                    style={{
                      display: "inline-block",
                      whiteSpace: "pre",
                    }}
                  >
                    {char}
                  </motion.span>
                </AnimatePresence>
              )}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </MotionConfig>
  );
}
