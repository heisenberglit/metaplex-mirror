import { Commitment, Connection, FeeCalculator, Blockhash, Transaction, TransactionSignature,SignatureStatus, SimulatedTransactionResponse, RpcResponseAndContext } from '@solana/web3.js';
import { TransactionInstruction, Keypair, PublicKey, AccountInfo  } from '@solana/web3.js';
import { loadCandyProgram, loadWalletKey } from '../helpers/accounts';
import { DEFAULT_TIMEOUT, SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../helpers/constants';
import { CACHE_PATH } from '../helpers/constants';
import base58 from 'bs58';
import fs from 'fs';

export type StringPublicKey = string;

export class LazyAccountInfoProxy<T> {
  executable: boolean = false;
  owner: StringPublicKey = '';
  lamports: number = 0;

  get data() {
    //
    return undefined as unknown as T;
  }
}

export interface LazyAccountInfo {
  executable: boolean;
  owner: StringPublicKey;
  lamports: number;
  data: [string, string];
}

const PubKeysInternedMap = new Map<string, PublicKey>();




export const toPublicKey = (key: string | PublicKey) => {
  if (typeof key !== 'string') {
    return key;
  }

  let result = PubKeysInternedMap.get(key);
  if (!result) {
    result = new PublicKey(key);
    PubKeysInternedMap.set(key, result);
  }

  return result;
};

export interface PublicKeyStringAndAccount<T> {
  pubkey: string;
  account: AccountInfo<T>;
}

export const WRAPPED_SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112',
);

export const BPF_UPGRADE_LOADER_ID = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111',
);

export const MEMO_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

export const METADATA_PROGRAM_ID =
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' as StringPublicKey;

export const VAULT_ID =
  'vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn' as StringPublicKey;

export const AUCTION_ID =
  'auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8' as StringPublicKey;

export const METAPLEX_ID =
  'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98' as StringPublicKey;

export const SYSTEM = new PublicKey('11111111111111111111111111111111');

import { BinaryReader, BinaryWriter, deserializeUnchecked, serialize } from 'borsh';
import {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import BN from 'bn.js';
export const METADATA_PREFIX = 'metadata';
export const EDITION = 'edition';
export const RESERVATION = 'reservation';

export const MAX_NAME_LENGTH = 32;

export const MAX_SYMBOL_LENGTH = 10;

export const MAX_URI_LENGTH = 200;

export const MAX_CREATOR_LIMIT = 5;

export const MAX_CREATOR_LEN = 32 + 1 + 1;
export const MAX_METADATA_LEN =
  1 +
  32 +
  32 +
  MAX_NAME_LENGTH +
  MAX_SYMBOL_LENGTH +
  MAX_URI_LENGTH +
  MAX_CREATOR_LIMIT * MAX_CREATOR_LEN +
  2 +
  1 +
  1 +
  198;

export const MAX_EDITION_LEN = 1 + 32 + 8 + 200;

export const EDITION_MARKER_BIT_SIZE = 248;

export enum MetadataKey {
  Uninitialized = 0,
  MetadataV1 = 4,
  EditionV1 = 1,
  MasterEditionV1 = 2,
  MasterEditionV2 = 6,
  EditionMarker = 7,
}

export enum MetadataCategory {
  Audio = 'audio',
  Video = 'video',
  Image = 'image',
  VR = 'vr',
}

export type MetadataFile = {
  uri: string;
  type: string;
};

export type FileOrString = MetadataFile | string;

export type Attribute = {
  trait_type?: string;
  display_type?: string;
  value: string | number;
};

export interface IMetadataExtension {
  name: string;
  symbol: string;

  creators: Creator[] | null;
  description: string;
  // preview image absolute URI
  image: string;
  animation_url?: string;

  attributes?: Attribute[];

  // stores link to item on meta
  external_url: string;

  seller_fee_basis_points: number;

  properties: {
    files?: FileOrString[];
    category: MetadataCategory;
    maxSupply?: number;
    creators?: {
      address: string;
      shares: number;
    }[];
  };
}

export class MasterEditionV1 {
  key: MetadataKey;
  supply: BN;
  maxSupply?: BN;
  /// Can be used to mint tokens that give one-time permission to mint a single limited edition.
  printingMint: StringPublicKey;
  /// If you don't know how many printing tokens you are going to need, but you do know
  /// you are going to need some amount in the future, you can use a token from this mint.
  /// Coming back to token metadata with one of these tokens allows you to mint (one time)
  /// any number of printing tokens you want. This is used for instance by Auction Manager
  /// with participation NFTs, where we dont know how many people will bid and need participation
  /// printing tokens to redeem, so we give it ONE of these tokens to use after the auction is over,
  /// because when the auction begins we just dont know how many printing tokens we will need,
  /// but at the end we will. At the end it then burns this token with token-metadata to
  /// get the printing tokens it needs to give to bidders. Each bidder then redeems a printing token
  /// to get their limited editions.
  oneTimePrintingAuthorizationMint: StringPublicKey;

  constructor(args: {
    key: MetadataKey;
    supply: BN;
    maxSupply?: BN;
    printingMint: StringPublicKey;
    oneTimePrintingAuthorizationMint: StringPublicKey;
  }) {
    this.key = MetadataKey.MasterEditionV1;
    this.supply = args.supply;
    this.maxSupply = args.maxSupply;
    this.printingMint = args.printingMint;
    this.oneTimePrintingAuthorizationMint =
      args.oneTimePrintingAuthorizationMint;
  }
}

export class MasterEditionV2 {
  key: MetadataKey;
  supply: BN;
  maxSupply?: BN;

  constructor(args: { key: MetadataKey; supply: BN; maxSupply?: BN }) {
    this.key = MetadataKey.MasterEditionV2;
    this.supply = args.supply;
    this.maxSupply = args.maxSupply;
  }
}

export class EditionMarker {
  key: MetadataKey;
  ledger: number[];

  constructor(args: { key: MetadataKey; ledger: number[] }) {
    this.key = MetadataKey.EditionMarker;
    this.ledger = args.ledger;
  }

  editionTaken(edition: number) {
    const editionOffset = edition % EDITION_MARKER_BIT_SIZE;
    const indexOffset = Math.floor(editionOffset / 8);

    if (indexOffset > 30) {
      throw Error('bad index for edition');
    }

    const positionInBitsetFromRight = 7 - (editionOffset % 8);

    const mask = Math.pow(2, positionInBitsetFromRight);

    const appliedMask = this.ledger[indexOffset] & mask;

    return appliedMask != 0;
  }
}

export class Edition {
  key: MetadataKey;
  /// Points at MasterEdition struct
  parent: StringPublicKey;
  /// Starting at 0 for master record, this is incremented for each edition minted.
  edition: BN;

  constructor(args: {
    key: MetadataKey;
    parent: StringPublicKey;
    edition: BN;
  }) {
    this.key = MetadataKey.EditionV1;
    this.parent = args.parent;
    this.edition = args.edition;
  }
}
export class Creator {
  address: StringPublicKey;
  verified: boolean;
  share: number;

  constructor(args: {
    address: StringPublicKey;
    verified: boolean;
    share: number;
  }) {
    this.address = args.address;
    this.verified = args.verified;
    this.share = args.share;
  }
}

export class Data {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Creator[] | null;
  constructor(args: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Creator[] | null;
  }) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
    this.creators = args.creators;
  }
}

export class Metadata {
  key: MetadataKey;
  updateAuthority: StringPublicKey;
  mint: StringPublicKey;
  data: Data;
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: number | null;

  // set lazy
  masterEdition?: StringPublicKey;
  edition?: StringPublicKey;

  constructor(args: {
    updateAuthority: StringPublicKey;
    mint: StringPublicKey;
    data: Data;
    primarySaleHappened: boolean;
    isMutable: boolean;
    editionNonce: number | null;
  }) {
    this.key = MetadataKey.MetadataV1;
    this.updateAuthority = args.updateAuthority;
    this.mint = args.mint;
    this.data = args.data;
    this.primarySaleHappened = args.primarySaleHappened;
    this.isMutable = args.isMutable;
    this.editionNonce = args.editionNonce;
  }

  public async init() {
    const edition = await getEdition(this.mint);
    this.edition = edition;
    this.masterEdition = edition;
  }
}

class CreateMetadataArgs {
  instruction: number = 0;
  data: Data;
  isMutable: boolean;

  constructor(args: { data: Data; isMutable: boolean }) {
    this.data = args.data;
    this.isMutable = args.isMutable;
  }
}
class CreateMasterEditionArgs {
  instruction: number = 10;
  maxSupply: BN | null;
  constructor(args: { maxSupply: BN | null }) {
    this.maxSupply = args.maxSupply;
  }
}

class MintPrintingTokensArgs {
  instruction: number = 9;
  supply: BN;

  constructor(args: { supply: BN }) {
    this.supply = args.supply;
  }
}
export async function getEdition(
  tokenMint: StringPublicKey,
): Promise<StringPublicKey> {
  const PROGRAM_IDS = programIds();

  return (
    await findProgramAddress(
      [
        Buffer.from(METADATA_PREFIX),
        toPublicKey(PROGRAM_IDS.metadata).toBuffer(),
        toPublicKey(tokenMint).toBuffer(),
        Buffer.from(EDITION),
      ],
      toPublicKey(PROGRAM_IDS.metadata),
    )
  )[0];
}


class UpdateMetadataArgs {
  instruction: number = 1;
  data: Data | null;
  // Not used by this app, just required for instruction
  updateAuthority: StringPublicKey | null;
  primarySaleHappened: boolean | null;
  constructor(args: {
    data?: Data;
    updateAuthority?: string;
    primarySaleHappened: boolean | null;
  }) {
    this.data = args.data ? args.data : null;
    this.updateAuthority = args.updateAuthority ? args.updateAuthority : null;
    this.primarySaleHappened = args.primarySaleHappened;
  }
}

const METADATA_SCHEMA = new Map<any, any>([
  [
    CreateMetadataArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['data', Data],
        ['isMutable', 'u8'], // bool
      ],
    },
  ],
  [
    UpdateMetadataArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['data', { kind: 'option', type: Data }],
        ['updateAuthority', { kind: 'option', type: 'pubkeyAsString' }],
        ['primarySaleHappened', { kind: 'option', type: 'u8' }],
      ],
    },
  ],

  [
    CreateMasterEditionArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['maxSupply', { kind: 'option', type: 'u64' }],
      ],
    },
  ],
  [
    MintPrintingTokensArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['supply', 'u64'],
      ],
    },
  ],
  [
    MasterEditionV1,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['supply', 'u64'],
        ['maxSupply', { kind: 'option', type: 'u64' }],
        ['printingMint', 'pubkeyAsString'],
        ['oneTimePrintingAuthorizationMint', 'pubkeyAsString'],
      ],
    },
  ],
  [
    MasterEditionV2,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['supply', 'u64'],
        ['maxSupply', { kind: 'option', type: 'u64' }],
      ],
    },
  ],
  [
    Edition,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['parent', 'pubkeyAsString'],
        ['edition', 'u64'],
      ],
    },
  ],
  [
    Data,
    {
      kind: 'struct',
      fields: [
        ['name', 'string'],
        ['symbol', 'string'],
        ['uri', 'string'],
        ['sellerFeeBasisPoints', 'u16'],
        ['creators', { kind: 'option', type: [Creator] }],
      ],
    },
  ],
  [
    Creator,
    {
      kind: 'struct',
      fields: [
        ['address', 'pubkeyAsString'],
        ['verified', 'u8'],
        ['share', 'u8'],
      ],
    },
  ],
  [
    Metadata,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['updateAuthority', 'pubkeyAsString'],
        ['mint', 'pubkeyAsString'],
        ['data', Data],
        ['primarySaleHappened', 'u8'], // bool
        ['isMutable', 'u8'], // bool
      ],
    },
  ],
  [
    EditionMarker,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['ledger', [31]],
      ],
    },
  ],
]);
export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    bpf_upgrade_loader: BPF_UPGRADE_LOADER_ID,
    system: SYSTEM,
    metadata: METADATA_PROGRAM_ID,
    memo: MEMO_ID,
    vault: VAULT_ID,
    auction: AUCTION_ID,
    metaplex: METAPLEX_ID,
  };
};



const getUnixTs = () => {
  return new Date().getTime() / 1000;
};


function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
interface BlockhashAndFeeCalculator {
  blockhash: Blockhash;
  feeCalculator: FeeCalculator;
}


async function simulateTransaction(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  // @ts-ignore
  transaction.recentBlockhash = await connection._recentBlockhash(
    // @ts-ignore
    connection._disableBlockhashCaching,
  );

  const signData = transaction.serializeMessage();
  // @ts-ignore
  const wireTransaction = transaction._serialize(signData);
  const encodedTransaction = wireTransaction.toString('base64');
  const config: any = { encoding: 'base64', commitment };
  const args = [encodedTransaction, config];

  // @ts-ignore
  const res = await connection._rpcRequest('simulateTransaction', args);
  if (res.error) {
    throw new Error('failed to simulate transaction: ' + res.error.message);
  }
  return res.result;
}

async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature,
  timeout: number,
  connection: Connection,
  commitment: Commitment = 'recent',
  queryStatus = false,
): Promise<SignatureStatus | null | void> {
  let done = false;
  let status: SignatureStatus | null | void = {
    slot: 0,
    confirmations: 0,
    err: null,
  };
  let subId = 0;
  status = await new Promise(async (resolve, reject) => {
    setTimeout(() => {
      if (done) {
        return;
      }
      done = true;
      console.log('Rejecting for timeout...');
      reject({ timeout: true });
    }, timeout);
    try {
      subId = connection.onSignature(
        txid,
        (result, context) => {
          done = true;
          status = {
            err: result.err,
            slot: context.slot,
            confirmations: 0,
          };
          if (result.err) {
            console.log('Rejected via websocket', result.err);
            reject(status);
          } else {
            console.log('Resolved via websocket', result);
            resolve(status);
          }
        },
        commitment,
      );
    } catch (e) {
      done = true;
      console.error('WS error in setup', txid, e);
    }
    while (!done && queryStatus) {
      // eslint-disable-next-line no-loop-func
      (async () => {
        try {
          const signatureStatuses = await connection.getSignatureStatuses([
            txid,
          ]);
          status = signatureStatuses && signatureStatuses.value[0];
          if (!done) {
            if (!status) {
              console.log('REST null result for', txid, status);
            } else if (status.err) {
              console.log('REST error for', txid, status);
              done = true;
              reject(status.err);
            } else if (!status.confirmations) {
              console.log('REST no confirmations for', txid, status);
            } else {
              console.log('REST confirmation for', txid, status);
              done = true;
              resolve(status);
            }
          }
        } catch (e) {
          if (!done) {
            console.log('REST connection error: txid', txid, e);
          }
        }
      })();
      await sleep(2000);
    }
  });

  //@ts-ignore
  if (connection._signatureSubscriptions[subId])
    connection.removeSignatureListener(subId);
  done = true;
  console.log('Returning status', status);
  return status;
}



async function sendSignedTransaction({
  signedTransaction,
  connection,
  timeout = DEFAULT_TIMEOUT,
}: {
  signedTransaction: Transaction;
  connection: Connection;
  sendingMessage?: string;
  sentMessage?: string;
  successMessage?: string;
  timeout?: number;
}): Promise<{ txid: string; slot: number }> {
  const rawTransaction = signedTransaction.serialize();
  const startTime = getUnixTs();
  let slot = 0;
  const txid: TransactionSignature = await connection.sendRawTransaction(
    rawTransaction,
    {
      skipPreflight: true,
    },
  );

  console.log('Started awaiting confirmation for', txid);

  let done = false;
  (async () => {
    while (!done && getUnixTs() - startTime < timeout) {
      connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      await sleep(500);
    }
  })();
  try {
    const confirmation = await awaitTransactionSignatureConfirmation(
      txid,
      timeout,
      connection,
      'recent',
      true,
    );

    if (!confirmation)
      throw new Error('Timed out awaiting confirmation on transaction');

    if (confirmation.err) {
      console.error(confirmation.err);
      throw new Error('Transaction failed: Custom instruction error');
    }

    slot = confirmation?.slot || 0;
  } catch (err) {
    console.error('Timeout Error caught', err);
    if (err.timeout) {
      throw new Error('Timed out awaiting confirmation on transaction');
    }
    let simulateResult: SimulatedTransactionResponse | null = null;
    try {
      simulateResult = (
        await simulateTransaction(connection, signedTransaction, 'single')
      ).value;
    } catch (e) {}
    if (simulateResult && simulateResult.err) {
      if (simulateResult.logs) {
        for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
          const line = simulateResult.logs[i];
          if (line.startsWith('Program log: ')) {
            throw new Error(
              'Transaction failed: ' + line.slice('Program log: '.length),
            );
          }
        }
      }
      throw new Error(JSON.stringify(simulateResult.err));
    }
    // throw new Error('Transaction failed');
  } finally {
    done = true;
  }

  console.log('Latency', txid, getUnixTs() - startTime);
  return { txid, slot };
}


const sendTransactionWithRetry = async (
  connection: Connection,
  wallet: Keypair,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  commitment: Commitment = 'singleGossip',
  includesFeePayer: boolean = false,
  block?: BlockhashAndFeeCalculator,
  beforeSend?: () => void,
) => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');

  let transaction = new Transaction();
  instructions.forEach(instruction => transaction.add(instruction));
  transaction.recentBlockhash = (
    block || (await connection.getRecentBlockhash(commitment))
  ).blockhash;

  if (includesFeePayer) {
    transaction.setSigners(...signers.map(s => s.publicKey));
  } else {
    transaction.setSigners(
      // fee payed by the wallet owner
      wallet.publicKey,
      ...signers.map(s => s.publicKey),
    );
  }

  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }
  const anchorProgram = await loadCandyProgram(wallet, 'devnet');
  console.log({includesFeePayer})

  if (!includesFeePayer) {
    // transaction = await wallet.signTransaction(transaction);
  }

  if (beforeSend) {
    beforeSend();
  }

  const { txid, slot } = await sendSignedTransaction({
    connection,
    signedTransaction: transaction,
  });

  return { txid, slot };
};


const findProgramAddress = async (
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey,
) => {
  const key =
    'pda-' +
    seeds.reduce((agg, item) => agg + item.toString('hex'), '') +
    programId.toString();
  const result = await PublicKey.findProgramAddress(seeds, programId);



  return [result[0].toBase58(), result[1]] as [string, number];
};




async function updateMetadata(
  data: Data | undefined,
  newUpdateAuthority: string | undefined,
  primarySaleHappened: boolean | null | undefined,
  mintKey: StringPublicKey,
  updateAuthority: StringPublicKey,
  instructions: TransactionInstruction[],
  metadataAccount?: StringPublicKey,
) {
  const metadataProgramId = programIds().metadata;

  metadataAccount =
    metadataAccount ||
    (
      await findProgramAddress(
        [
          Buffer.from('metadata'),
          toPublicKey(metadataProgramId).toBuffer(),
          toPublicKey(mintKey).toBuffer(),
        ],
        toPublicKey(metadataProgramId),
      )
    )[0];

  const value = new UpdateMetadataArgs({
    data,
    updateAuthority: !newUpdateAuthority ? undefined : newUpdateAuthority,
    primarySaleHappened:
      primarySaleHappened === null || primarySaleHappened === undefined
        ? null
        : primarySaleHappened,
  });

  console.log({value})
   
  //console.log({METADATA_SCHEMA, value})
  const txnData = Buffer.from(serialize(METADATA_SCHEMA, value));
  console.log(txnData);
  const keys = [
    {
      pubkey: toPublicKey(metadataAccount),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(updateAuthority),
      isSigner: true,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(metadataProgramId),
      data: txnData,
    }),
  );

  return metadataAccount;
}

export const updateMetadatas = async (walletPath, updateMetadataFilePath, env) => {

const metadataProgramId = programIds().metadata;
const wallet = loadWalletKey(walletPath);
const updateSigners: Keypair[] = [wallet];
var updatedURIList = JSON.parse(fs.readFileSync(updateMetadataFilePath, {encoding:'utf8', flag:'r'}));
const payerPublicKey = wallet.publicKey.toBase58();
const anchorProgram = await loadCandyProgram(wallet, env);

for(let i = 0 ; i< updatedURIList.length ; i++)
{
    const updateInstructions: TransactionInstruction[] = [];
    const TOKEN_MINT_ID = updatedURIList[i].token_id;
    const mintKey = new PublicKey(TOKEN_MINT_ID);

    var creators = [];
    for(var j= 0 ; j< updatedURIList[i].creators.length ; j++){
      creators.push(
        new Creator({
          "address": updatedURIList[i].creators[j].address,
          "verified": updatedURIList[i].creators[j].verified,
          "share": updatedURIList[i].creators[j].share
        })
      )
    }

    const metadata= {
        name:  updatedURIList[i].name,
        symbol: updatedURIList[i].symbol,
        creators: creators,
        sellerFeeBasisPoints: updatedURIList[i].sellerFeeBasisPoints ? updatedURIList[i].sellerFeeBasisPoints : 500 ,
        uri : updatedURIList[i].uri
  }

  const metadataAccount = (
    await findProgramAddress(
      [
        Buffer.from('metadata'),
        toPublicKey(metadataProgramId).toBuffer(),
        toPublicKey(mintKey).toBuffer(),
      ],
      toPublicKey(metadataProgramId),
    )
  )[0];


  await updateMetadata(
    new Data({
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      creators: metadata.creators,
      sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
    }),
    undefined,
    true,
    mintKey.toBase58(),
    payerPublicKey,
    updateInstructions,
    metadataAccount,
  );

  const txid = await sendTransactionWithRetry(
    anchorProgram.provider.connection,
    wallet,
    updateInstructions,
    updateSigners,
  );

  updatedURIList[i].txid = txid;

  if (!fs.existsSync(CACHE_PATH)) {
    fs.mkdirSync(CACHE_PATH);
  }
  fs.writeFileSync(CACHE_PATH + '/metadata_update.json', JSON.stringify(updatedURIList));
  console.log(txid)
 }
}



// Required to properly serialize and deserialize pubKeyAsString types
const extendBorsh = () => {
  (BinaryReader.prototype as any).readPubkey = function () {
    const reader = this as unknown as BinaryReader;
    const array = reader.readFixedArray(32);
    return new PublicKey(array);
  };

  (BinaryWriter.prototype as any).writePubkey = function (value: any) {
    const writer = this as unknown as BinaryWriter;
    writer.writeFixedArray(value.toBuffer());
  };

  (BinaryReader.prototype as any).readPubkeyAsString = function () {
    const reader = this as unknown as BinaryReader;
    const array = reader.readFixedArray(32);
    return base58.encode(array) as StringPublicKey;
  };

  (BinaryWriter.prototype as any).writePubkeyAsString = function (
    value: StringPublicKey
  ) {
    const writer = this as unknown as BinaryWriter;
    writer.writeFixedArray(base58.decode(value));
  };
};

extendBorsh();