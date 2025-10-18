///////////////////////////////////////////////////////////////////////////////
// region Signal and Slot handling

function addToDictArray(dct: any, key: string, item: any)
{
  if(!dct[key]) dct[key] = [];
  dct[key].push(item);
}

// Signals names are typically dotted paths For example: 'app.colors.item.click'
type SignalName = string;

// Slots have an arbitrary data object and a signal name
// The data is kept as the first parameter, so that any function with one param can also be a slot
type Slot = (data: any, signal: SignalName) => void;

// Connection switchboard for signals to slots
const SwitchBoard: { [signal: SignalName]: Slot[] } = {};

type Signal = { signal: SignalName, data: any };
const SignalQueue: Signal[] = [];

// Connect a signal to a slot or other signal
export const wire = (signal: SignalName, target: Slot|string) =>
{
  // If the target is a function, otherwise its another signal, so create a function that emits the signal.
  let slot: Slot = (typeof target === 'function') ? target : (data, sig) => emit(target, data);

  // Append the slot to the signal's slot list.
  addToDictArray(SwitchBoard, signal, slot);
  console.log(signal, target)
};

// When a signal is emitted, add it to the queue
// The dispatch is run only if this is the first signal that came in
// If signal handling causes more signals to be emitted, they will be added to the queue and be picked up
// by the next loop of the dispatch code.
export const emit = (signal: SignalName, data: any = null) =>
{
  console.log(signal, data)
  SignalQueue.push({signal, data});
  if(SignalQueue.length === 1) dispatch();
};

// Dispatch the signals in the queue
const dispatch = () =>
{
  // Keep looping till the queue is empty (slots may emit more signals to get queued)
  while(SignalQueue.length)
  {
    // Grab the first signal call all slots
    // We dont remove it from the queue yet, so that any other signals emitted by the slots are queued up
    const sig: Signal = SignalQueue[0];
    const slots = SwitchBoard[sig.signal] || [];
    for(const slot of slots)
    {
      slot(sig.data, sig.signal);
    }

    // Pop the processed signal
    SignalQueue.shift();
    console.log(sig);
  }
};

// endregion Signal and Slot handling
///////////////////////////////////////////////////////////////////////////////
