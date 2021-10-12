use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
};

#[derive(Debug, BorshSerialize, BorshDeserialize)]
pub struct Status {
    pub repos: u32,
}



fn as_u32_le(array: &[u8; 4]) -> u32 {
    ((array[0] as u32) <<  0) |
    ((array[1] as u32) <<  8) |
    ((array[2] as u32) << 16) |
    ((array[3] as u32) << 24)
}

pub fn set_repos(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    use std::convert::TryInto;
    let account_info_iter = &mut accounts.iter();

    let status_account = next_account_info(account_info_iter)?;
    // let destination_info = next_account_info(account_info_iter)?;
    
    if status_account.owner != program_id {
        msg!("Account owner doesn't match program_id")
    }
    
    let status: Status = Status {
        repos: as_u32_le(instruction_data.try_into().expect("Instruction less than 4 bytes"))
    };
    status.serialize(&mut &mut status_account.data.borrow_mut()[..])?;
    Ok(())
}
