﻿using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Tide.Core;
using Microsoft.IdentityModel.Tokens;
using Tide.Simulator.Models;

namespace Tide.Simulator.Classes {
    public class Authentication : IAuthentication {

        private readonly Settings _settings;

        public Authentication(Settings settings) {
         
            _settings = settings;

   
        }

        public (bool success,string error) Register(AuthenticationRequest request) {
            return (false, "not implemented");
            //try
            //{
            //    if (string.IsNullOrEmpty(request.OrkId) || string.IsNullOrEmpty(request.PublicKey))
            //    {
            //        return (false, "Invalid PublicKey");
            //    }

            //    var currentAccount = _context.Accounts.FirstOrDefault(u => u.OrkId == request.OrkId);
            //    if (currentAccount != null)
            //    {
            //        if (currentAccount.PublicKey == request.PublicKey) return (true, null);
            //        return (false, "Invalid Ork Id");
            //    }

            //    var newAccount = new Account
            //    {
            //        OrkId = request.OrkId,
            //        PublicKey = request.PublicKey
            //    };

            //    _context.Add(newAccount);
            //    _context.SaveChanges();

            //    return (true, null);
            //}
            //catch (Exception e)
            //{
            //    return (false, e.Message);
            //}
        }

        public Account GetAccount(string orkId) {
            return null;
            //  return _context.Accounts.FirstOrDefault(a => a.OrkId == orkId);
        }
    }
}