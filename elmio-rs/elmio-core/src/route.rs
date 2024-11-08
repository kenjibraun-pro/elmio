pub trait Route {
    fn name(&self) -> String;
    fn path(&self) -> String;
}
