variable "compartment_id" {
  type        = string
  description = "The compartment to create the resources in"
}

variable "region" {
  type        = string
  description = "The region to provision the resources in"
}

variable "ssh_public_key" {
  type        = string
  description = "The SSH public key to use for connecting to the worker nodes"
}

<<<<<<< HEAD
=======
# variable "tenancy_ocid" {
#   default = ""
# }

# variable "user_ocid" {
#   default = ""
# }

# variable "fingerprint" {
#   default = ""
# }

# variable "private_key_path" {
#   default = ""
# }

# variable "compartment_ocid" {
#   default = ""
# }

# variable "kms_key_ocid" {
#   default = ""
# }

>>>>>>> 484d697cf47e4cbc3dc43e7d791e89fb69be885e
