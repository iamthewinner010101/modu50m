export const ROUTE_COMMENT_TIMEOUTS = {read:8000, write:15000};

// Reading is safe to repeat once after a deadline; writes keep one attempt.
export async function readRouteComments(url, configuration = {}) {
  try {return await requestRouteComments(url, {}, configuration);}
  catch (error) {
    if (error.code !== 'ROUTE_COMMENTS_TIMEOUT') throw error;
    return requestRouteComments(url, {}, configuration);
  }
}

// A deadline covers both response headers and JSON, without retrying a write.
export async function requestRouteComments(url, options = {}, {
  fetchImpl = fetch,
  timeoutMs = (options.method || 'GET') === 'GET' ? ROUTE_COMMENT_TIMEOUTS.read : ROUTE_COMMENT_TIMEOUTS.write,
} = {}) {
  const controller = new AbortController();
  const signal = controller.signal;
  let timedOut = false;
  const abortFromCaller = () => controller.abort(options.signal.reason);
  if (options.signal?.aborted) abortFromCaller();
  else options.signal?.addEventListener('abort', abortFromCaller, {once:true});
  const timer = setTimeout(() => {
    if (signal.aborted) return;
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetchImpl(url, {
      credentials:'same-origin', ...options,
      headers:{'Content-Type':'application/json', ...options.headers}, signal,
    });
    let data;
    try {data = await response.json();}
    catch (error) {
      if (signal.aborted) throw error;
      throw new Error('댓글 서버의 응답을 확인하지 못했어요.', {cause:error});
    }
    if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : '댓글 저장 결과를 확인하지 못했어요.');
    return data;
  } catch (error) {
    if (timedOut) {
      throw Object.assign(new Error((options.method || 'GET') === 'GET'
        ? '댓글 서버의 응답이 늦어 연결을 멈췄어요. 잠시 후 새로고침해 주세요.'
        : '서버의 응답이 늦어 저장 결과를 확인하지 못했어요. 글은 그대로 두었어요. 새로고침으로 먼저 확인해 주세요.', {cause:error}), {code:'ROUTE_COMMENTS_TIMEOUT'});
    }
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}
