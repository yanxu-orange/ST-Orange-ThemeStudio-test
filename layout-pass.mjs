/** Complete synchronous layout jobs, reading every job before resuming any writes.
 * A job yields a read-only measurement function and receives its result.
 * Same-kind jobs keep each intermediate read phase even when it has no work;
 * returning early is safe, skipping a phase would misalign dependent writes. */
export function runLayoutPass(jobs){
  const results=[],pending=[...jobs].map((job,index)=>({job,index,measurement:undefined}));
  while(pending.length){
    const reads=[];
    for(const item of pending){const step=item.job.next(item.measurement);if(step.done)results[item.index]=step.value;else{item.read=step.value;reads.push(item);}}
    pending.length=0;
    for(const item of reads){item.measurement=item.read();pending.push(item);}
  }
  return results;
}
