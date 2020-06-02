// Tide Protocol - Infrastructure for the Personal Data economy
// Copyright (C) 2019 Tide Foundation Ltd
// 
// This program is free software and is subject to the terms of 
// the Tide Community Open Source License as published by the 
// Tide Foundation Limited. You may modify it and redistribute 
// it in accordance with and subject to the terms of that License.
// This program is distributed WITHOUT WARRANTY of any kind, 
// including without any implied warranty of MERCHANTABILITY or 
// FITNESS FOR A PARTICULAR PURPOSE.
// See the Tide Community Open Source License for more details.
// You should have received a copy of the Tide Community Open 
// Source License along with this program.
// If not, see https://tide.org/licenses_tcosl-1-0-en

using System;
using System.Numerics;
using System.Threading.Tasks;
using Tide.Core;
using Tide.Encryption.AesMAC;

namespace Tide.Ork.Classes {
    public interface IKeyManager {
        Task<bool> Exist(Guid user);
        Task<BigInteger> GetAuthShare(Guid user);
        Task<AesKey> GetSecret(Guid user);
        Task<KeyVault> GetByUser(Guid user);
        Task SetOrUpdateKey(Guid user, BigInteger authShare, BigInteger keyShare, AesKey secret);
    }
}