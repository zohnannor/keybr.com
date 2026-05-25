import { KeySpeedChart, Marker } from "@keybr/chart";
import { LearningRate, LessonKey, Target } from "@keybr/lesson";
import { KeyDetails, KeySelector, useFormatter } from "@keybr/lesson-ui";
import { hasData } from "@keybr/math";
import { type KeyStatsMap, timeToSpeed } from "@keybr/result";
import { useSettings } from "@keybr/settings";
import { Explainer, Figure, Icon, Para } from "@keybr/widget";
import {
  mdiChevronDown,
  mdiChevronRight,
  mdiEmoticonHappy,
  mdiEmoticonSad,
} from "@mdi/js";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { ChartWrapper } from "./ChartWrapper.tsx";
import * as gridStyles from "./KeySpeedChartGrid.module.less";
import { SmoothnessRange } from "./SmoothnessRange.tsx";

export function KeySpeedChartSection({
  keyStatsMap,
}: {
  keyStatsMap: KeyStatsMap;
}) {
  const { settings } = useSettings();
  const { letters } = keyStatsMap;
  const [current, setCurrent] = useState(letters[0]);
  const [smoothness, setSmoothness] = useState(0.5);
  const [showGrid, setShowGrid] = useState(false);
  const target = new Target(settings);
  const { formatSpeed, formatConfidence, formatLearningRate } = useFormatter();
  const allSamples = letters.flatMap(
    (letter) => keyStatsMap.get(letter).samples,
  );

  useEffect(() => {
    if (!letters.includes(current)) {
      setCurrent(letters[0]);
    }
  }, [letters, current]);

  const keyStats = keyStatsMap.get(current);
  const { samples } = keyStats;

  return (
    <Figure>
      <Figure.Caption>
        <FormattedMessage
          id="profile.chart.keySpeed.caption"
          defaultMessage="Key Typing Speed"
        />
      </Figure.Caption>

      <Explainer>
        <Figure.Description>
          <FormattedMessage
            id="profile.chart.keySpeed.description"
            defaultMessage="This chart shows the typing speed change for each individual key."
          />
        </Figure.Description>
      </Explainer>

      <Para align="center">
        <KeySelector
          keyStatsMap={keyStatsMap}
          current={current}
          onSelect={(current) => {
            setCurrent(current);
          }}
        />
      </Para>

      <Para align="center">
        <KeyDetails lessonKey={LessonKey.from(keyStats, target)} />
      </Para>

      <ChartWrapper>
        <KeySpeedChart
          samples={samples}
          smoothness={smoothness}
          width="100%"
          height="25rem"
        />
      </ChartWrapper>

      <div
        role="button"
        tabIndex={0}
        className={gridStyles.toggle}
        onClick={() => {
          setShowGrid((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowGrid((v) => !v);
          }
        }}
      >
        <Icon shape={showGrid ? mdiChevronDown : mdiChevronRight} />
        <span>{showGrid ? "Hide" : "Show"} all keys</span>
      </div>

      {showGrid && (
        <div className={gridStyles.grid}>
          {letters.map((letter) => {
            const ks = keyStatsMap.get(letter);
            const lessonKey = LessonKey.from(ks, target);
            const { timeToType, bestTimeToType, confidence, bestConfidence } =
              lessonKey;
            const learningRate =
              LearningRate.from(lessonKey.samples, target)?.learningRate ??
              null;
            return (
              <div key={letter.codePoint} className={gridStyles.card}>
                <div className={gridStyles.letter}>{letter.label}</div>
                <div className={gridStyles.details}>
                  {timeToType != null &&
                  bestTimeToType != null &&
                  confidence != null &&
                  bestConfidence != null ? (
                    <>
                      <div>
                        <span className={gridStyles.name}>Last:</span>{" "}
                        <span className={gridStyles.value}>
                          {formatSpeed(timeToSpeed(timeToType))} (
                          {formatConfidence(confidence)})
                        </span>
                      </div>
                      <div>
                        <span className={gridStyles.name}>Top:</span>{" "}
                        <span className={gridStyles.value}>
                          {formatSpeed(timeToSpeed(bestTimeToType))} (
                          {formatConfidence(bestConfidence)})
                        </span>
                      </div>
                      <div>
                        <span className={gridStyles.name}>Rate:</span>{" "}
                        {learningRate != null && !isNaN(learningRate) ? (
                          <span
                            className={
                              learningRate !== 0
                                ? learningRate > 0
                                  ? gridStyles.positive
                                  : gridStyles.negative
                                : gridStyles.value
                            }
                          >
                            {formatLearningRate(learningRate)}{" "}
                            {learningRate > 0 && (
                              <Icon shape={mdiEmoticonHappy} />
                            )}
                            {learningRate < 0 && (
                              <Icon shape={mdiEmoticonSad} />
                            )}
                          </span>
                        ) : (
                          <span className={gridStyles.uncertain}>
                            {formatLearningRate(null)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span>Not calibrated</span>
                  )}
                </div>
                <KeySpeedChart
                  samples={ks.samples}
                  smoothness={smoothness}
                  width="100%"
                  height="7rem"
                  padding={{ left: 3, right: 0.5, top: 1, bottom: 1 }}
                  showBottomAxis={false}
                  compact={true}
                />
              </div>
            );
          })}
        </div>
      )}

      <SmoothnessRange
        disabled={!hasData(allSamples)}
        value={smoothness}
        onChange={setSmoothness}
      />

      <Figure.Legend>
        <FormattedMessage
          id="profile.chart.keySpeed.legend"
          defaultMessage="Horizontal axis: lesson number. Vertical axis: {label1} – typing speed for the currently selected key, {label2} – target typing speed."
          values={{
            label1: <Marker type="speed" />,
            label2: <Marker type="threshold" />,
          }}
        />
      </Figure.Legend>
    </Figure>
  );
}
