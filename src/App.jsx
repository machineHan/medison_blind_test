import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { isFirebaseEnabled } from "./firebase";
import {
  loadOrCreateParticipant,
  markParticipantComplete,
  saveMetricScore,
  subscribeParticipants,
} from "./surveyDb";

const questions = [
  { sampleTitle: "3VT 01", file: "N0029_NM3_3VT_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "3VT 02", file: "N0190_NM13_3VT_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "3VT 03", file: "N0215_EX2_3VT_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "score", candidate_3: "ddib" },
  { sampleTitle: "3VT 04", file: "N0216_GD5_3VT_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "3VT 05", file: "N0257_EX5_3VT_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "3VT 06", file: "N0268_GD9_3VT_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "flow", candidate_3: "ddib" },

  { sampleTitle: "3VV 01", file: "N0029_NM3_3VV_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "3VV 02", file: "N0111_NM8_3VV_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "ddib", candidate_3: "score" },
  { sampleTitle: "3VV 03", file: "N0190_NM13_3VV2_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "3VV 04", file: "N0190_NM13_3VV_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "3VV 05", file: "N0215_EX2_3VV2_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "score", candidate_3: "ddib" },
  { sampleTitle: "3VV 06", file: "N0215_EX2_3VV_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "score", candidate_3: "ddib" },
  { sampleTitle: "3VV 07", file: "N0216_GD5_3VV_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "ddib", candidate_3: "flow" },
  { sampleTitle: "3VV 08", file: "N0257_EX5_3VV_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "ddib", candidate_3: "flow" },
  { sampleTitle: "3VV 09", file: "N0268_GD9_3VV_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "ddib", candidate_3: "score" },

  { sampleTitle: "4CH 01", file: "N0020_NM2_4CH_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "ddib", candidate_3: "flow" },
  { sampleTitle: "4CH 02", file: "N0029_NM3_4CH_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "ddib", candidate_3: "flow" },
  { sampleTitle: "4CH 03", file: "N0111_NM8_4CH_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "flow", candidate_3: "ddib" },
  { sampleTitle: "4CH 04", file: "N0190_NM13_4CH_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "4CH 05", file: "N0215_EX2_4CH_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "flow", candidate_3: "ddib" },
  { sampleTitle: "4CH 06", file: "N0216_GD5_4CH_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "ddib", candidate_3: "flow" },
  { sampleTitle: "4CH 07", file: "N0257_EX5_4CH_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "flow", candidate_3: "ddib" },
  { sampleTitle: "4CH 08", file: "N0268_GD9_4CH_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },

  { sampleTitle: "LVOT 01", file: "N0020_NM2_LVOT_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "flow", candidate_3: "score" },
  { sampleTitle: "LVOT 02", file: "N0190_NM13_LVOT_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "ddib", candidate_3: "flow" },
  { sampleTitle: "LVOT 03", file: "N0215_EX2_LVOT_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "ddib", candidate_3: "flow" },
  { sampleTitle: "LVOT 04", file: "N0216_GD5_LVOT_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "LVOT 05", file: "N0257_EX5_LVOT_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "ddib", candidate_3: "score" },
  { sampleTitle: "LVOT 06", file: "N0268_GD9_LVOT_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "flow", candidate_3: "ddib" },

  { sampleTitle: "RVOT 01", file: "N0020_NM2_RVOT_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "ddib", candidate_3: "score" },
  { sampleTitle: "RVOT 02", file: "N0111_NM8_RVOT_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "flow", candidate_3: "score" },
  { sampleTitle: "RVOT 03", file: "N0215_EX2_RVOT_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "score", candidate_3: "ddib" },
  { sampleTitle: "RVOT 04", file: "N0257_EX5_RVOT2_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "RVOT 05", file: "N0257_EX5_RVOT_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "flow", candidate_3: "score" },
  { sampleTitle: "RVOT 06", file: "N0268_GD9_RVOT_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "ddib", candidate_3: "score" },

  { sampleTitle: "AA 01", file: "N0020_NM2_AA_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "flow", candidate_3: "score" },
  { sampleTitle: "AA 02", file: "N0029_NM3_AA_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "flow", candidate_3: "ddib" },
  { sampleTitle: "AA 03", file: "N0111_NM8_AA_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "AA 04", file: "N0190_NM13_AA_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "AA 05", file: "N0215_EX2_AA_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "score", candidate_3: "ddib" },
  { sampleTitle: "AA 06", file: "N0216_GD5_AA_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "score", candidate_3: "ddib" },
  { sampleTitle: "AA 07", file: "N0257_EX5_AA_s512_z100_c0_h0.png", candidate_1: "ddib", candidate_2: "score", candidate_3: "flow" },
  { sampleTitle: "AA 08", file: "N0268_GD9_AA_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "ddib", candidate_3: "score" },

  { sampleTitle: "DA 01", file: "N0190_NM13_DA_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "ddib", candidate_3: "score" },
  { sampleTitle: "DA 02", file: "N0215_EX2_DA_s512_z100_c0_h0.png", candidate_1: "score", candidate_2: "flow", candidate_3: "ddib" },
  { sampleTitle: "DA 03", file: "N0257_EX5_DA_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "ddib", candidate_3: "score" },
  { sampleTitle: "DA 04", file: "N0268_GD9_DA_s512_z100_c0_h0.png", candidate_1: "flow", candidate_2: "ddib", candidate_3: "score" },
].map((item, index) => ({
  id: `Q${String(index + 1).padStart(2, "0")}`,
  view: item.sampleTitle.split(" ")[0],
  ...item,
}));

const metrics = [
  {
    id: "artifact",
    label: "아티팩트 개선",
    full: "3D 영상 특유의 패턴 아티팩트가 완화되었나요?",
    scale: ["전혀 완화되지 않음", "소폭 완화", "다소 완화", "확연히 완화"],
  },
  {
    id: "hallucination",
    label: "할루시네이션 개선",
    full: "영상 내 실제 존재하지 않는 구조가 관찰되었나요?",
    scale: ["명확하게 관찰됨", "다소 관찰됨", "경미하게 관찰됨", "관찰되지 않음"],
  },
  {
    id: "resolution",
    label: "해상도 개선",
    full: "영상의 전반적인 해상도와 세부 구조 표현이 개선되었나요?",
    scale: ["전혀 개선되지 않음", "소폭 개선", "다소 개선", "확연히 개선"],
  },
  {
    id: "contrast",
    label: "Contrast 개선",
    full: "영상 전반의 대비가 개선되었나요?",
    scale: ["전혀 개선되지 않음", "소폭 개선", "다소 개선", "확연히 개선"],
  },
  {
    id: "noise",
    label: "노이즈 개선",
    full: "영상 전반의 노이즈가 감소하였나요?",
    scale: ["전혀 감소하지 않음", "소폭 감소", "다소 감소", "확연히 감소"],
  },
];

const candidateList = [
  { id: "candidate_1", label: "Candidate 1" },
  { id: "candidate_2", label: "Candidate 2" },
  { id: "candidate_3", label: "Candidate 3" },
];

const methods = ["score", "ddib", "flow"];

const answerKey = questions.reduce((acc, question) => {
  acc[question.id] = {
    candidate_1: question.candidate_1,
    candidate_2: question.candidate_2,
    candidate_3: question.candidate_3,
  };
  return acc;
}, {});

function cn(...items) {
  return items.filter(Boolean).join(" ");
}

function countQuestionScores(questionAnswer) {
  if (!questionAnswer) return 0;

  return candidateList.reduce((sum, candidate) => {
    const scores = questionAnswer[candidate.id] || {};
    return sum + metrics.filter((metric) => scores[metric.id] !== undefined).length;
  }, 0);
}

function countAllScores(answers) {
  return questions.reduce((sum, question) => sum + countQuestionScores(answers?.[question.id]), 0);
}

function CompactScoreButtons({ selected, onSelect, metric }) {
  return (
    <div className="mx-auto grid max-w-[120px] grid-cols-4 gap-1 sm:max-w-[220px] sm:gap-2">
      {[0, 1, 2, 3].map((score) => (
        <button
          key={score}
          onClick={() => onSelect(score)}
          title={metric.scale[score]}
          className={cn(
            "h-9 rounded-lg border text-sm font-black transition active:scale-[0.98] sm:h-11 sm:rounded-xl sm:text-lg",
            selected === score
              ? "border-[#0f5d75] bg-[#0f5d75] text-white shadow-md shadow-[#0f5d75]/20"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          {score}
        </button>
      ))}
    </div>
  );
}

function CompactScoreTable({ question, answers, onScore }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm sm:rounded-[1.5rem]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-300 bg-white px-3 py-2 sm:px-5 sm:py-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          {question.sampleTitle}
        </h2>

        <div className="text-right text-[11px] font-black text-slate-400 sm:text-sm">
          후보별 5개 항목 평가
        </div>
      </div>

      <table className="w-full table-fixed border-collapse text-center">
        <thead>
          <tr>
            <th className="w-[26%] border-b border-r border-slate-300 bg-white px-1 py-3 text-xs font-black text-slate-950 sm:w-[25%] sm:px-3 sm:py-6" />

            {candidateList.map((candidate) => (
              <th
                key={candidate.id}
                className="border-b border-r border-slate-300 bg-white px-1 py-3 text-sm font-black text-slate-950 last:border-r-0 sm:px-3 sm:py-6 sm:text-3xl"
              >
                {candidate.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.id}>
              <th className="border-r border-t border-slate-300 bg-white px-2 py-3 text-left text-xs font-black leading-tight text-slate-950 sm:px-8 sm:py-6 sm:text-3xl">
                {metric.label}
              </th>

              {candidateList.map((candidate) => {
                const selected = answers[question.id]?.[candidate.id]?.[metric.id];

                return (
                  <td
                    key={candidate.id}
                    className="border-r border-t border-slate-300 px-1 py-2 last:border-r-0 sm:px-4 sm:py-6"
                  >
                    <CompactScoreButtons
                      selected={selected}
                      metric={metric}
                      onSelect={(score) => onScore(question.id, candidate.id, metric.id, score)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold leading-snug text-slate-500 sm:px-5 sm:py-3 sm:text-sm">
        0: 매우 낮음 / 전혀 개선되지 않음 · 1: 소폭 개선 · 2: 다소 개선 · 3: 확연히 개선
      </div>
    </div>
  );
}

function StartScreen({ evaluatorId, setEvaluatorId, onStart, onResults, participantCount }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="h-3 bg-[#0f5d75]" />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-12">
        <div>
          <div className="mb-6 flex items-start justify-between gap-4 sm:mb-10">
            <div>
              <p className="text-xl font-black tracking-tight text-[#174a5e] sm:text-2xl">
                Blind Test
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-[#174a5e] sm:text-5xl">
                영상 평가 기준 수립
              </h1>
            </div>

            <div className="hidden text-right text-sm font-semibold text-slate-500 md:block">
              Medical Artificial
              <br />
              Intelligence Laboratory
            </div>
          </div>

          <div className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
            {metrics.map((metric, index) => (
              <div key={metric.id} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                <h2 className="text-lg font-black leading-snug text-slate-950 sm:text-2xl">
                  {index + 1}. {metric.full}
                </h2>

                <p className="mt-1 text-base font-bold leading-snug text-slate-700 sm:text-xl">
                  (0점: {metric.scale[0]}, 1점: {metric.scale[1]}, 2점: {metric.scale[2]}, 3점: {metric.scale[3]})
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="self-center rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:rounded-[2rem] sm:p-7">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#eaf4f7] px-4 py-2 text-sm font-extrabold text-[#0f5d75]">
            <ClipboardCheck size={16} />
            Metric-based Blind Evaluation
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            3 Candidates × 5 Metrics
          </h2>

          <p className="mt-3 text-base leading-7 text-slate-600">
            Candidate 1, 2, 3의 품질을 항목별로 0~3점 평가함.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-3xl font-black">{questions.length}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">평가 샘플</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-3xl font-black">3</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Candidates</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-3xl font-black">{metrics.length}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">평가 항목</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
            저장 모드: {isFirebaseEnabled ? "Firebase Firestore" : "localStorage"} · 등록 평가자 {participantCount}명
          </div>

          <label className="mt-6 block text-sm font-extrabold text-slate-700">
            평가자 ID
          </label>

          <input
            value={evaluatorId}
            onChange={(event) => setEvaluatorId(event.target.value)}
            placeholder="예: rater_01"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-lg font-bold outline-none transition focus:border-[#0f5d75] focus:bg-white"
          />

          <button
            onClick={onStart}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f5d75] px-5 py-4 text-lg font-black text-white shadow-lg shadow-[#0f5d75]/20"
          >
            평가 시작 <ChevronRight size={20} />
          </button>

          <button
            onClick={onResults}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-black text-slate-700"
          >
            <BarChart3 size={18} />
            결과 대시보드 미리보기
          </button>
        </div>
      </section>
    </main>
  );
}

function EvaluationScreen({
  evaluatorId,
  answers,
  setAnswers,
  onResults,
  onReset,
  onParticipantAnswers,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const question = questions[currentIndex];

  const totalScores = questions.length * candidateList.length * metrics.length;
  const savedScores = countAllScores(answers);
  const progress = Math.round((savedScores / totalScores) * 100);
  const currentComplete = countQuestionScores(answers[question.id]);
  const currentTotal = candidateList.length * metrics.length;

  const onScore = async (questionId, candidateId, metricId, score) => {
    const nextAnswers = {
      ...answers,
      [questionId]: {
        ...(answers[questionId] || {}),
        [candidateId]: {
          ...((answers[questionId] || {})[candidateId] || {}),
          [metricId]: score,
        },
      },
    };

    setAnswers(nextAnswers);
    onParticipantAnswers(nextAnswers);

    try {
      setIsSaving(true);
      await saveMetricScore({
        evaluatorId,
        questionId,
        candidateId,
        metricId,
        score,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const goToQuestion = async (nextIndex) => {
    if (nextIndex >= questions.length) {
      await markParticipantComplete(evaluatorId);
      onResults();
      return;
    }

    setCurrentIndex(nextIndex);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-2 py-2 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f5d75] sm:text-xs sm:tracking-[0.25em]">
              Metric Blind Test
            </p>

            <h1 className="truncate text-xl font-black text-slate-950 sm:text-3xl">
              {question.sampleTitle}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div className="hidden rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-600 sm:block">
              전체 {progress}% 완료
            </div>

            <div className="rounded-xl bg-slate-50 px-2.5 py-2 text-[11px] font-black text-slate-600 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
              {currentComplete}/{currentTotal}
            </div>

            <div className="hidden rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-500 sm:block">
              {isSaving ? "저장 중" : "저장됨"}
            </div>

            <button
              onClick={onResults}
              className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
            >
              결과
            </button>

            <button
              onClick={onReset}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-black text-slate-600 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-1.5 py-2 sm:px-6 sm:py-6">
        <CompactScoreTable question={question} answers={answers} onScore={onScore} />

        <div className="mt-3 flex items-center justify-between pb-20 sm:justify-end sm:gap-3 sm:pb-0">
          <button
            onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 disabled:opacity-40 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base"
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={16} />
            이전
          </button>

          <button
            onClick={() => goToQuestion(currentIndex + 1)}
            className="fixed bottom-4 right-4 z-30 flex items-center gap-1 rounded-2xl bg-[#0f5d75] px-5 py-3 text-sm font-black text-white shadow-xl shadow-[#0f5d75]/25 disabled:opacity-40 sm:static sm:px-5 sm:py-3 sm:text-base"
          >
            {currentIndex === questions.length - 1 ? "완료" : "다음"}
            <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </main>
  );
}

function aggregate(participants) {
  const modelMetric = {};

  methods.forEach((method) => {
    modelMetric[method] = {};
    metrics.forEach((metric) => {
      modelMetric[method][metric.id] = [];
    });
  });

  participants.forEach((participant) => {
    questions.forEach((question) => {
      candidateList.forEach((candidate) => {
        const method = answerKey[question.id][candidate.id];

        metrics.forEach((metric) => {
          const value = participant.answers?.[question.id]?.[candidate.id]?.[metric.id];
          if (typeof value === "number") {
            modelMetric[method][metric.id].push(value);
          }
        });
      });
    });
  });

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return {
    totalByModel: methods.map((method) => {
      const allScores = metrics.flatMap((metric) => modelMetric[method][metric.id]);
      return { method, average: avg(allScores), count: allScores.length };
    }),

    metricRows: metrics.map((metric) => ({
      metric,
      scores: methods.map((method) => ({
        method,
        average: avg(modelMetric[method][metric.id]),
        count: modelMetric[method][metric.id].length,
      })),
    })),
  };
}

function ScoreBar({ value }) {
  const width = `${Math.max(0, Math.min(100, (value / 3) * 100))}%`;

  return (
    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-[#0f5d75]" style={{ width }} />
    </div>
  );
}

function ResultsScreen({ participants, currentEvaluatorId, currentAnswers, onBack }) {
  const [scope, setScope] = useState("all");

  const currentParticipant = {
    evaluatorId: currentEvaluatorId || "current_rater",
    answers: currentAnswers || {},
  };

  const sourceParticipants = scope === "current" ? [currentParticipant] : participants;
  const result = useMemo(() => aggregate(sourceParticipants), [sourceParticipants]);
  const sortedTotal = [...result.totalByModel].sort((a, b) => b.average - a.average);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="h-3 bg-[#0f5d75]" />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#0f5d75]">
              Result Dashboard
            </p>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              모델별 세부 평가 집계
            </h1>

            <p className="mt-2 text-sm font-bold text-slate-500">
              집계 대상 평가자 {sourceParticipants.length}명 · 저장 모드 {isFirebaseEnabled ? "Firebase" : "localStorage"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setScope("all")}
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-black",
                scope === "all" ? "bg-slate-950 text-white" : "bg-white text-slate-600"
              )}
            >
              전체 응답
            </button>

            <button
              onClick={() => setScope("current")}
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-black",
                scope === "current" ? "bg-slate-950 text-white" : "bg-white text-slate-600"
              )}
            >
              현재 응답만
            </button>

            <button
              onClick={onBack}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600"
            >
              평가로 돌아가기
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {sortedTotal.map((item, index) => (
            <div
              key={item.method}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Rank {index + 1}
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    {item.method}
                  </h2>
                </div>

                {index === 0 ? (
                  <Trophy className="text-[#0f5d75]" />
                ) : (
                  <BarChart3 className="text-slate-300" />
                )}
              </div>

              <p className="mt-6 text-5xl font-black tracking-tight text-slate-950">
                {item.average.toFixed(2)}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-500">
                / 3.00 · {item.count} scores
              </p>

              <div className="mt-5">
                <ScoreBar value={item.average} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2 text-lg font-black text-slate-950">
              <ClipboardCheck size={20} />
              평가 항목별 평균 점수
            </div>

            <div className="space-y-5">
              {result.metricRows.map((row) => (
                <div key={row.metric.id} className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="text-base font-black text-slate-950">
                    {row.metric.label}
                  </h3>

                  <div className="mt-4 space-y-3">
                    {row.scores.map((score) => (
                      <div
                        key={score.method}
                        className="grid grid-cols-[92px_1fr_50px] items-center gap-2 sm:grid-cols-[130px_1fr_60px] sm:gap-3"
                      >
                        <p className="truncate text-sm font-black text-slate-700">
                          {score.method}
                        </p>

                        <ScoreBar value={score.average} />

                        <p className="text-right text-sm font-black text-slate-950">
                          {score.average.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2 text-lg font-black text-slate-950">
              <Eye size={20} />
              항목별 모델 점수 나열
            </div>

            <div className="space-y-4">
              {result.metricRows.map((row) => {
                const ranking = [...row.scores].sort((a, b) => b.average - a.average);

                return (
                  <div key={row.metric.id} className="rounded-2xl bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-black text-slate-700">
                      {row.metric.label}
                    </p>

                    <div className="space-y-2">
                      {ranking.map((score, index) => (
                        <div
                          key={score.method}
                          className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "grid h-7 w-7 place-items-center rounded-full text-xs font-black",
                                index === 0
                                  ? "bg-[#0f5d75] text-white"
                                  : "bg-slate-100 text-slate-500"
                              )}
                            >
                              {index + 1}
                            </span>

                            <span className="text-sm font-black text-slate-800">
                              {score.method}
                            </span>
                          </div>

                          <span className="text-sm font-black text-slate-950">
                            {score.average.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState("start");
  const [evaluatorId, setEvaluatorId] = useState("");
  const [answers, setAnswers] = useState({});
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeParticipants((items) => {
      setParticipants(items);
    });

    return () => unsubscribe?.();
  }, []);

  const startEvaluation = async () => {
    const cleanId = evaluatorId.trim();

    if (!cleanId) {
      alert("평가자 ID를 입력해주세요.");
      return;
    }

    const participant = await loadOrCreateParticipant(cleanId);
    setAnswers(participant.answers || {});
    setScreen("eval");
  };

  const updateParticipantAnswers = (nextAnswers) => {
    setParticipants((prev) => {
      const key = String(evaluatorId || "").trim().replace(/\s+/g, "_").toLowerCase();
      const evaluatorKey = encodeURIComponent(key);
      const existingIndex = prev.findIndex((item) => item.evaluatorKey === evaluatorKey);

      if (existingIndex < 0) {
        return [
          ...prev,
          {
            evaluatorId,
            evaluatorKey,
            answers: nextAnswers,
          },
        ];
      }

      const next = [...prev];
      next[existingIndex] = {
        ...next[existingIndex],
        answers: nextAnswers,
      };
      return next;
    });
  };

  const reset = () => {
    const ok = window.confirm("현재 화면의 입력 상태만 초기화할까요? 이미 저장된 서버/localStorage 데이터는 유지됩니다.");
    if (!ok) return;

    setAnswers({});
    setScreen("start");
  };

  if (screen === "start") {
    return (
      <StartScreen
        evaluatorId={evaluatorId}
        setEvaluatorId={setEvaluatorId}
        onStart={startEvaluation}
        onResults={() => setScreen("results")}
        participantCount={participants.length}
      />
    );
  }

  if (screen === "results") {
    return (
      <ResultsScreen
        participants={participants}
        currentEvaluatorId={evaluatorId}
        currentAnswers={answers}
        onBack={() => setScreen(evaluatorId ? "eval" : "start")}
      />
    );
  }

  return (
    <EvaluationScreen
      evaluatorId={evaluatorId.trim()}
      answers={answers}
      setAnswers={setAnswers}
      onResults={() => setScreen("results")}
      onReset={reset}
      onParticipantAnswers={updateParticipantAnswers}
    />
  );
}
