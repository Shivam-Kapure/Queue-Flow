import { createQueue, joinQueue, nextUser, getPosition, estimateWaitTime, leaveQueue } from './index.js';

function runTests() {
  console.log('--- Running QueueFlow Core Engine Tests ---');

  // Test 1: FIFO Queue
  console.log('\nTesting FIFO Queue:');
  let fifo = createQueue({ type: 'FIFO', name: 'FIFO Test', avgProcessingTime: 30 });
  joinQueue(fifo, { id: 'u1', name: 'Alice' });
  joinQueue(fifo, { id: 'u2', name: 'Bob' });
  joinQueue(fifo, { id: 'u3', name: 'Charlie' });

  console.assert(getPosition(fifo, 'u1') === 1, 'Alice should be 1st');
  console.assert(getPosition(fifo, 'u2') === 2, 'Bob should be 2nd');
  console.assert(getPosition(fifo, 'u3') === 3, 'Charlie should be 3rd');
  console.assert(estimateWaitTime(fifo, 3) === 60, 'Charlie wait time should be 60s');

  const served1 = nextUser(fifo);
  console.assert(served1.id === 'u1', 'Alice should be served first');
  console.assert(getPosition(fifo, 'u2') === 1, 'Bob should now be 1st');
  console.log('FIFO OK!');

  // Test 2: Priority Queue
  console.log('\nTesting Priority Queue:');
  let priorityQueue = createQueue({ type: 'PRIORITY', name: 'Priority Test' });
  joinQueue(priorityQueue, { id: 'u1', name: 'Alice' }, { priority: 2 });
  joinQueue(priorityQueue, { id: 'u2', name: 'Bob' }, { priority: 5 }); // higher priority
  joinQueue(priorityQueue, { id: 'u3', name: 'Charlie' }, { priority: 1 });

  console.assert(getPosition(priorityQueue, 'u2') === 1, 'Bob should be 1st due to high priority');
  console.assert(getPosition(priorityQueue, 'u1') === 2, 'Alice should be 2nd');
  console.assert(getPosition(priorityQueue, 'u3') === 3, 'Charlie should be 3rd');
  console.log('Priority OK!');

  // Test 3: VIP Queue
  console.log('\nTesting VIP Queue:');
  let vipQueue = createQueue({ type: 'VIP', name: 'VIP Test' });
  joinQueue(vipQueue, { id: 'u1', name: 'Alice' });
  joinQueue(vipQueue, { id: 'u2', name: 'Bob' });
  joinQueue(vipQueue, { id: 'u3', name: 'VIP Charlie' }, { isVip: true });

  console.assert(getPosition(vipQueue, 'u3') === 1, 'VIP Charlie should be 1st (cut inline)');
  console.assert(getPosition(vipQueue, 'u1') === 2, 'Alice should be 2nd');
  console.assert(getPosition(vipQueue, 'u2') === 3, 'Bob should be 3rd');
  console.log('VIP OK!');

  console.log('\nAll core engine tests passed successfully!');
}

runTests();
