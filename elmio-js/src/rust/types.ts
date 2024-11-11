type Model<T> = T;

type Msg = PureMsg | EffectfulMsg;

interface PureMsg {
    msg: unknown;
}

interface SubscriptionMsg {
    type: string;
    config: EffectfulMsg | unknown;
}

interface Page<T> {
    id(): string;
    init(): Model<T>;
    update(msg: Msg, model: Model<T>): Model<T>;
    updateFromJs(msg: JsMsg<T>, model: Model<T>): Model<T>;
    getSubscriptions(model: Model<T>): Subscription<T>[];
    viewBody(model: Model<T>): string;
}

interface JsMsg<T> {
    type: string;
    data: T;
}

interface Effect {
    type: string;
    config: DomEffect | TimeEffect | ConsoleEffect | NavigationEffect | LocalStorageEffect;
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

interface TimeEffect {
    type: string;
    config: unknown;
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

type EventTargetWindow = object;

type EventTargetDocument = object;

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

interface LocalStorageEffect {
    type: string;
    config: LocalStorageGetItem | LocalStorageSetItem;
}

interface SessionStorageEffect {
    type: string;
    config: SessionStorageGetItem | SessionStorageSetItem;
}

interface LocalStorageGetItem {
    key: string;
}

interface LocalStorageSetItem {
    key: string;
    value: string;
}

interface SessionStorageGetItem {
    key: string;
}

interface SessionStorageSetItem {
    key: string;
    value: string;
}

interface StorageGetItem {
    key: string;
}

interface StorageSetItem {
    key: string;
    value: string;
}

interface EffectfulMsg {
    msg: unknown;
    effect: Effect;
    // TODO: remove sourceEvent, the event is populated from js (not rust)
    sourceEvent: Event | null;
}

interface Subscription<T> {
    type: string;
    config: RustInterval | RustEventListener;
}

interface RustInterval {
    id: string;
    duration: number;
    msg: SubscriptionMsg;
}

interface RustEventListener {
    id: string;
    listenTarget: string;
    eventType: string;
    matchers: EventMatcher[];
    msg: SubscriptionMsg;
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

export type {
    Page,
    Model,
    Msg,
    Subscription,
    RustInterval,
    RustEventListener,
    DebounceConfig,
    EventMatcher,
    ExactSelectorMatcher,
    ClosestSelectorMatcher,
    MouseButtonMatcher,
    KeyboardKeyMatcher,
    Effect,
    NavigationEffect,
    LocalStorageEffect,
    SessionStorageEffect,
    StorageGetItem,
    StorageSetItem,
    EffectfulMsg,
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
