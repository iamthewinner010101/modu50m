import {useId} from 'react';
import {journeyProjectStats} from '../data/journeyProjectStats.js';
import './JourneyProjectStory.css';

const improvements = [
  {before:'건물은 알겠는데, 버스에서 내린 뒤의 길은 보이지 않았어요.', after:'정류장 → 보도 → 갈림길 → 선택한 입구를 한 미니어처에 담고, 번호마다 실제 사진을 연결했습니다.'},
  {before:'도로가 크게 나온 사진에서는 보도의 바닥을 찾기 어려웠어요.', after:'보도·턱·출입문을 살펴볼 다른 사진을 함께 넣고, 확대와 다음 지점 비교를 연결했습니다.'},
  {before:'준비 입력란이 길고, 같은 위치의 댓글은 찾기 어려웠어요.', after:'사진과 이동 순서를 먼저 보여 주고, 댓글은 선택한 번호에서 바로 열도록 바꿨습니다. 개인 준비는 필요할 때 펼칩니다.'},
];

export default function JourneyProjectStory({standalone = false}) {
  const stats=journeyProjectStats();
  const Title=standalone?'h1':'h2';
  const SectionTitle=standalone?'h2':'h3';
  const StepTitle=standalone?'h3':'h4';
  const storyId=useId();
  const methodId=storyId+'-method';
  const improvementsId=standalone?'jps-improvements-title':storyId+'-improvements';
  const checkId=storyId+'-checks';
  return <section className="jps-story" aria-label="작품의 목적과 만드는 과정">
    <p className="jps-eyebrow">모두의 50m · 만든 이유와 바꾼 과정</p>
    <Title className="jps-title">가고 싶은 곳은 찾았는데,<br/>내린 뒤의 길은 어떨까요?</Title>
    <p className="jps-lead">대전에 처음 오는 휠체어 사용자와 이동이 불편한 분이, 정류장부터 입구까지의 길을 미리 살펴보도록 돕는 작품입니다. 가고 싶은 곳을 스스로 고르고 준비하는 데 보탬이 되고 싶었습니다.</p>
    <p className="jps-key">흩어진 사진을 <strong>실제 이동을 살펴볼 순서</strong>로 묶고,<br/>한 사람의 질문을 <strong>같은 위치의 다음 사람</strong>에게 이어 줍니다.</p>
    <dl className="jps-numbers"><div><dt>대표 장소</dt><dd>{stats.places}<small>곳</small></dd></div><div><dt>정류장부터 입구까지</dt><dd>{stats.steps}<small>구간</small></dd></div><div><dt>실제 참고 사진</dt><dd>{stats.photos}<small>장</small></dd></div></dl>

    <section className="jps-section" aria-labelledby={methodId}>
      <SectionTitle id={methodId}>사진을 길의 순서로 연결합니다.</SectionTitle>
      <ol className="jps-process">
        <li><b>01</b><div><StepTitle>내리는 곳과 찾아갈 문을 먼저 정합니다.</StepTitle><p>정류장 이름·번호·도로의 어느 쪽인지와 목적지 입구를 구분합니다. 같은 시설의 다른 문을 혼동하지 않도록 했습니다.</p></div></li>
        <li><b>02</b><div><StepTitle>지도와 서로 다른 사진을 대조합니다.</StepTitle><p>거리뷰, 공식 자료, 방문 사진에서 표지·건물·바닥을 비교합니다. 사진 출처와 날짜 정보를 남겨 원본도 다시 볼 수 있게 했습니다.</p></div></li>
        <li><b>03</b><div><StepTitle>같은 번호에 모형·사진·안내·댓글을 묶습니다.</StepTitle><p>미니어처는 전체 순서를, 실제 사진은 보도·턱·문 앞 바닥을 보여 줍니다. 그 위치에서 궁금한 점을 남기고 답글과 공감을 나눌 수 있습니다.</p></div></li>
      </ol>
      <div className="jps-data-flow" aria-label="자료를 화면으로 연결하는 구조"><span>지도·사진 대조</span><span>장소·구간 번호</span><span>사진과 이동 안내</span><span>같은 위치의 댓글</span></div>
      <details className="jps-details"><summary>화면 안에서는 어떻게 연결되나요?</summary><p>React와 JavaScript로 화면을 만들고, 장소 ID와 구간 ID를 기준으로 사진과 안내를 연결합니다. 공유 댓글·답글·공감은 서버 API와 SQLite에 저장합니다. 개인 준비 기록은 이용자의 브라우저에 따로 보관합니다.</p></details>
    </section>

    <section className="jps-section" aria-labelledby={improvementsId}>
      <SectionTitle id={improvementsId}>제작 중 발견한 불편을 이렇게 고쳤습니다.</SectionTitle>
      <div className="jps-change-list">{improvements.map(item=><article key={item.before}><p><span>발견한 불편</span>{item.before}</p><p><span>바꾼 화면</span>{item.after}</p></article>)}</div>
    </section>

    <section className="jps-section jps-checks" aria-labelledby={checkId}>
      <SectionTitle id={checkId}>작동 확인과 이용자 확인을 이어 갑니다.</SectionTitle>
      <div><strong>화면에서 확인한 것</strong><p>대표 10곳에서 장소 선택 → 번호별 실제 사진 → 위치별 댓글 → 첫 화면 복귀를 PC와 휴대폰 크기로 점검했습니다. 댓글의 작성·답글·공유 저장도 개발 과정에서 검사했습니다.</p></div>
      <div><strong>다음으로 확인할 것</strong><p>실제 이용자나 이동 지원 담당자께 화면을 보여 드리고, 정류장·갈림길·입구를 찾는 과정에서 무엇이 헷갈리는지 듣고 반영할 계획입니다. 사진 사이 연결과 현재 현장 상태도 계속 보완해야 합니다.</p></div>
      <p className="jps-example-note">화면의 ‘예시’ 댓글은 사용법을 보여 주기 위한 글입니다. 실제 이용자의 방문 후기와 구분합니다.</p>
    </section>

    <aside className="jps-scope"><strong>전체 길은 모형으로, 세부 모습은 실제 사진으로.</strong><p>미니어처는 지도·사진을 참고해 AI로 만든 모형이며 실측 지형은 아닙니다. 코드와 글 정리에도 AI의 도움을 받았습니다. 바닥의 폭·경사와 현재 통행 상태는 사진이나 댓글 수만으로 판단할 수 없어, 확인이 필요한 부분을 함께 안내합니다.</p></aside>
    <details className="jps-details"><summary>참고 자료와 출처 보기</summary><ul><li><a href="https://makeabilitylab.cs.washington.edu/project/sidewalk/" target="_blank" rel="noreferrer">Project Sidewalk · 사진과 사람의 참여로 보행 환경을 살펴보는 선행 연구 ↗</a></li><li><a href="https://access.visitkorea.or.kr/cos/detail.do?cotId=4973c767-8e6c-4c86-99b4-4419e819011e" target="_blank" rel="noreferrer">한국관광공사 · 한밭수목원 관광·편의 정보 ↗</a></li><li>사진별 원본 출처와 날짜는 각 장소의 실제 사진에서 확인할 수 있습니다.</li></ul></details>
    <p className="jps-ending">다음 여행자가 같은 길을 덜 막막하게 준비할 수 있도록,<br/><strong>한 위치씩 작은 도움을 이어 가고 싶습니다.</strong></p>
  </section>;
}
