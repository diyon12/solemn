/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solemn.json`.
 */
export type Solemn = {
  "address": "82H3B7Sf7wEf3nv1u8FTDfgHoRZNzY8poH27RPqcFNCK",
  "metadata": {
    "name": "solemn",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "approvePromise",
      "discriminator": [
        7,
        31,
        139,
        87,
        173,
        28,
        215,
        231
      ],
      "accounts": [
        {
          "name": "promise",
          "writable": true
        },
        {
          "name": "promiser",
          "writable": true,
          "relations": [
            "promise"
          ]
        },
        {
          "name": "judge",
          "signer": true,
          "relations": [
            "promise"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "claimTimeout",
      "discriminator": [
        130,
        234,
        45,
        53,
        120,
        90,
        86,
        178
      ],
      "accounts": [
        {
          "name": "promise",
          "writable": true
        },
        {
          "name": "charity",
          "writable": true,
          "relations": [
            "promise"
          ]
        },
        {
          "name": "caller",
          "docs": [
            "Anyone can call ini — biasanya promiser sendiri atau bot"
          ],
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "createPromise",
      "discriminator": [
        233,
        170,
        35,
        24,
        34,
        120,
        82,
        200
      ],
      "accounts": [
        {
          "name": "promise",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  109,
                  105,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "promiser"
              },
              {
                "kind": "arg",
                "path": "deadline"
              }
            ]
          }
        },
        {
          "name": "promiser",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stakeAmount",
          "type": "u64"
        },
        {
          "name": "deadline",
          "type": "i64"
        },
        {
          "name": "judge",
          "type": "pubkey"
        },
        {
          "name": "charity",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [],
      "args": []
    },
    {
      "name": "rejectPromise",
      "discriminator": [
        156,
        218,
        29,
        144,
        96,
        170,
        24,
        128
      ],
      "accounts": [
        {
          "name": "promise",
          "writable": true
        },
        {
          "name": "charity",
          "writable": true,
          "relations": [
            "promise"
          ]
        },
        {
          "name": "judge",
          "signer": true,
          "relations": [
            "promise"
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "promise",
      "discriminator": [
        172,
        179,
        140,
        81,
        180,
        237,
        23,
        191
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "stakeTooLow",
      "msg": "Stake amount must be at least 0.001 SOL"
    },
    {
      "code": 6001,
      "name": "deadlineInPast",
      "msg": "Deadline must be in the future"
    },
    {
      "code": 6002,
      "name": "deadlineTooFar",
      "msg": "Deadline cannot be more than 1 year away"
    },
    {
      "code": 6003,
      "name": "unauthorizedJudge",
      "msg": "Only the assigned judge can perform this action"
    },
    {
      "code": 6004,
      "name": "promiseNotActive",
      "msg": "Promise is not in active state"
    },
    {
      "code": 6005,
      "name": "deadlineNotReached",
      "msg": "Deadline has not been reached yet"
    },
    {
      "code": 6006,
      "name": "selfJudgeNotAllowed",
      "msg": "Promiser cannot be their own judge"
    }
  ],
  "types": [
    {
      "name": "promise",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "promiser",
            "type": "pubkey"
          },
          {
            "name": "judge",
            "type": "pubkey"
          },
          {
            "name": "charity",
            "type": "pubkey"
          },
          {
            "name": "stakeAmount",
            "type": "u64"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "promiseStatus"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "promiseStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "approved"
          },
          {
            "name": "rejected"
          },
          {
            "name": "timedOut"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "promiseSeed",
      "type": "bytes",
      "value": "[112, 114, 111, 109, 105, 115, 101]"
    }
  ]
};
