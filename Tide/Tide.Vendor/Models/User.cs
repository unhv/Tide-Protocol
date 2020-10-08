﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Tide.Vendor.Models
{
    public class User
    {
        public string Id { get; set; } // Vuid
        public string VendorKey { get; set; }

        public List<RentalApplication> RentalApplications { get; set; }
    }
}
