mod entrypoint;
pub mod processor;

#[cfg(all(feature = "custom-panic", target_arch = "bpf"))]
#[no_mangle]
fn custom_panic(info: &core::panic::PanicInfo<'_>) {
    solana_program::msg!("Custom panic hook");
    solana_program::msg!("{}", info);
}
