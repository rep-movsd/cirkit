import {addToDictArray} from './cirkit-utils.js';

type Signal = string;

// Slots have an arbitrary data object and a signal name
// The data is kept as the first parameter, so that any function with one param can also be a slot
type Slot = (data: any, signal: Signal) => void;

const SwitchBoard: { [signal: Signal]: Slot[] } = {};

const wire = (signal: Signal, target: Slot|string) =>
{
  // If the target is a function, otherwise its another signal, so create a function that emits the signal.
  let slot: Slot = (typeof target === 'function') ? target : (data, sig) => emit(sig, data);

  // Append the slot to the signal's slot list.
  addToDictArray(SwitchBoard, signal, slot);
};

type Signaling = { signal: Signal, data: any };
const SignalQueue: Signaling[] = [];

// When a signal is emitted, add it to the queue
// The dispatch is run only if this is the first signal that came in
// If signal handling causes another signal to be emitted, it will be added to the queue and be picked up
// by the next loop of the dispatch code.
const emit = (signal: Signal, data: any = null) =>
{
  SignalQueue.push({signal, data});
  if(SignalQueue.length === 1) dispatch();
};

// Dispatch the signals in the queue
const dispatch = () =>
{
  // Keep looping till the queue is empty (slots may emit more signals to get queued)
  while(SignalQueue.length)
  {
    // Grab in FIFO order, call all slots
    const sig: Signaling = SignalQueue.shift()!;
    const slots = SwitchBoard[sig.signal] || [];
    for(const slot of slots)
    {
      slot(sig.data, sig.signal);
    }
    console.log(sig);
  }
};


export {wire, emit, Signal, Slot};
