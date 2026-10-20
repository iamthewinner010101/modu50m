import test from 'node:test';
import assert from 'node:assert/strict';
import {appendPreparationQuestion, observationsForPhoto, questionsForStep} from './previsitQuestions.js';
import {saveVisitProgress, readVisitProgress} from './visitProgress.js';

test('다른 장면에 주 사진의 위치 표시를 옮겨 붙이지 않는다', () => {
  const review = {observations: [{label: '주 사진의 문턱', position: [10, 20]}]};
  assert.deepEqual(observationsForPhoto({image: '/different-scene.jpg'}, review), []);
  assert.deepEqual(observationsForPhoto(null, review), review.observations);
  const current = {observations: [{label: '현재 사진의 바닥'}]};
  assert.deepEqual(observationsForPhoto(current, review), current.observations);
});

test('질문을 추가해도 사용자가 적은 내용은 유지하고 같은 질문은 반복하지 않는다', () => {
  const before = '동행인과 문 여는 방법을 확인하기';
  const item = '[05 출입문] 문 앞 바닥을 확인하고 싶어요.';
  const added = appendPreparationQuestion(before, item);
  assert.equal(added.value, `${before}\n${item}`);
  assert.equal(added.status, 'added');
  assert.deepEqual(appendPreparationQuestion(added.value, item), {value: added.value, status: 'duplicate'});
});

test('저장 길이를 넘으면 기존 질문을 잘라내거나 교체하지 않는다', () => {
  const current = '가'.repeat(1590);
  assert.deepEqual(appendPreparationQuestion(current, '문 앞 상세 사진을 더 보고 싶어요.'), {value: current, status: 'full'});
  assert.equal(appendPreparationQuestion('가'.repeat(1597), '나나').value.length, 1600);
});

test('연결이 비는 구간의 질문에는 실제 다음 구간의 번호와 이름을 넣는다', () => {
  const route = {steps: [{title: '현재 보도', stage: 'approach', next: {status: 'gap'}}, {title: '동쪽 관람객 문', stage: 'entrance'}]};
  const items = questionsForStep(route, 0);
  assert.equal(items.length, 3);
  assert.match(items[2].text, /\[01 현재 보도\].*02번 동쪽 관람객 문/);
  assert.equal(questionsForStep(route, 1).length, 2);
  assert.deepEqual(questionsForStep(route, -1), []);
});

test('질문 저장·복원은 현장 확인이나 사진 검토 완료를 임의로 추가하지 않는다', () => {
  const route = {placeId: 'test-place', steps: [{id: 'door', title: '유리 출입문', stage: 'entrance'}]};
  const records = new Map();
  const storage = {getItem: k => records.get(k) ?? null, setItem: (k,v) => records.set(k,v)};
  const question = appendPreparationQuestion('', questionsForStep(route, 0)[0].text).value;
  const saved = saveVisitProgress(storage, 'qa', route, {reviewed: [], question}, null);
  assert.equal(saved.fieldVerified, false);
  assert.equal(saved.continuousRouteVerified, false);
  const loaded = readVisitProgress(storage, 'qa', route);
  assert.equal(loaded.question, question);
  assert.deepEqual(loaded.reviewed, []);
});

test('거리 진입부에 건물 출입문이 있다고 가정한 질문을 붙이지 않는다', () => {
  const questions = questionsForStep({placeId:'skyroad',steps:[{title:'거리 진입부',stage:'entrance'}]},0);
  assert.ok(questions.every(q=>!q.text.includes('출입문')));
});
