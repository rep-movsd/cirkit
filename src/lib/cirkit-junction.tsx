import {addToDictArray} from './cirkit-utils.js';


type Signal = string;
type Slot = (signal: Signal, ctx: any) => void;

const SwitchBoard: { [signal: Signal]: Slot[] } = {};

const wire = (signal: Signal, target: Slot|string) =>
{
  // If the target is a function, otherwise its another signal, so create a function that emits the signal.
  let slot: Slot = (typeof target === 'function') ? target : (sig, ctx) => emit(sig, ctx);

  // Append the slot to the signal's slot list.
  addToDictArray(SwitchBoard, signal, slot);
};

type Signaling = { signal: Signal, ctx: any };
const SignalQueue: Signaling[] = [];

// When a signal is emitted, add it to the queue
// The dispatch is run only if this is the first signal that came in
// If signal handling causes another signal to be emitted, it will be added to the queue and be picked up
// by the next loop of the dispatch code.
const emit = (signal: Signal, ctx: any = null) =>
{
  SignalQueue.push({signal, ctx});
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
      slot(sig.signal, sig.ctx);
    }
    console.log(sig);
  }
};


export {wire, emit, Signal, Slot};
