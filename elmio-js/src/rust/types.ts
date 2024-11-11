type Model<T> = T;

type Msg<T> = PureMsg<T> | MessageWithEffect<T>;

interface PureMsg<T> {
    msg: T;
}

interface SubscriptionMsg<T> {
    type: string;
    config: MessageWithEffect<T> | T;
}

interface Page<T> {
    id(): string;
    init(): Model<T>;
    update(msg: Msg<T>, model: Model<T>): Model<T>;
    updateFromJs(msg: JsMsg<T>, model: Model<T>): Model<T>;
    getSubscriptions(model: Model<T>): Subscription<T>[];
    viewBody(model: Model<T>): string;
}

interface JsMsg<T> {
    type: string;
    data: T;
}

interface Effect<T> {
    type: string;
    config: DomEffect | TimeEffect<T> | ConsoleEffect | NavigationEffect | StorageEffect;
}

interface NavigationEffect {
    type: string;
    config: string;
}

interface DomEffect {
    type: string;
    config:
        | DispatchEvent
        | FocusElement
        | SelectInputText
        | GetElementValue
        | GetRadioGroupValue
        | GetTargetDataValue;
}

interface ConsoleEffect {
    type: string;
    config: Log;
}

type Log = {
    message: string;
};

interface ClipboardEffect {
    type: string;
    config: WriteText;
}

type WriteText = {
    text: string;
};

interface WriteTextResult {
    success: boolean;
    error: string | null;
}

interface BrowserEffect {
    type: string;
    config: SetTimeoutConfig;
}

interface SetTimeoutConfig {
    duration: number;
}

interface TimeEffect<T> {
    type: string;
    config: T;
}

interface DispatchEvent {
    eventTarget: EventTarget;
    eventType: string;
    bubbles: boolean;
    cancelable: boolean;
}

interface EventTarget {
    type: string;
    config: EventTargetWindow | EventTargetDocument | EventTargetElement;
}

interface EventTargetWindow {}

interface EventTargetDocument {}

interface EventTargetElement {
    elementId: string;
}

interface FocusElement {
    elementId: string;
}

interface SelectInputText {
    elementId: string;
}

interface GetElementValue {
    elementId: string;
    parseAsJson: boolean;
}

interface GetRadioGroupValue {
    selector: string;
    parseAsJson: boolean;
}

interface GetFiles {
    elementId: string;
}

interface GetTargetDataValue {
    name: string;
    selector: string;
    parseAsJson: boolean;
}

interface StorageEffect {
    type: string;
    config: StorageGetItem | StorageSetItem;
    storageType: "localStorage" | "sessionStorage";
}

interface StorageGetItem {
    key: string;
}

interface StorageSetItem {
    key: string;
    value: string;
}

interface MessageWithEffect<T> {
    msg: T;
    effect: Effect<T>;
    // TODO: remove sourceEvent, the event is populated from js (not rust)
    sourceEvent: Event | null;
}

interface Subscription<T> {
    type: string;
    config: PeriodicSubscription<T> | EventSubscription<T>;
}

interface PeriodicSubscription<T> {
    id: string;
    duration: number;
    msg: SubscriptionMsg<T>;
}

interface EventSubscription<T> {
    id: string;
    listenTarget: string;
    eventType: string;
    matchers: EventMatcher[];
    msg: SubscriptionMsg<T>;
    propagation: EventPropagation;
}

interface EventMatcher {
    type: string;
    config: ExactSelectorMatcher | ClosestSelectorMatcher | MouseButtonMatcher | KeyboardKeyMatcher;
}

interface ExactSelectorMatcher {
    selector: string;
}

interface ClosestSelectorMatcher {
    selector: string;
}

interface KeyboardKeyMatcher {
    key: string;
    requiresCtrl: boolean;
    requiresMeta: boolean;
}

interface MouseButtonMatcher {
    button: string;
}

interface EventPropagation {
    stopPropagation: boolean;
    preventDefault: boolean;
}

interface DebounceConfig {
    delay: number;
    leading: boolean;
    trailing: boolean;
}

interface FileInfo {
    name: string;
    mime: string;
    size: number;
    lastModified: number;
}

export {
    Page,
    Model,
    Msg,
    Subscription,
    PeriodicSubscription,
    EventSubscription,
    DebounceConfig,
    EventMatcher,
    ExactSelectorMatcher,
    ClosestSelectorMatcher,
    MouseButtonMatcher,
    KeyboardKeyMatcher,
    Effect,
    NavigationEffect,
    StorageEffect,
    StorageGetItem,
    StorageSetItem,
    MessageWithEffect,
    PureMsg,
    SubscriptionMsg,
    DomEffect,
    TimeEffect,
    GetElementValue,
    GetRadioGroupValue,
    GetFiles,
    FileInfo,
    GetTargetDataValue,
    FocusElement,
    SelectInputText,
    DispatchEvent,
    EventTarget,
    EventTargetWindow,
    EventTargetDocument,
    EventTargetElement,
    ConsoleEffect,
    Log,
    ClipboardEffect,
    WriteText,
    WriteTextResult,
    JsMsg,
    BrowserEffect,
    SetTimeoutConfig,
};
