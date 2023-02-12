output "k8s-cluster-id" {
  value = oci_containerengine_cluster.k8s_cluster.id
}

<<<<<<< HEAD
output "public_subnet_id" {
  value = oci_core_subnet.vcn_public_subnet.id
}

output "node_pool_id" {
  value = oci_containerengine_node_pool.k8s_node_pool.id
=======


# For the bucket in dev
output "buckets" {
  value = oci_objectstorage_bucket.dev_bucket.name
>>>>>>> 484d697cf47e4cbc3dc43e7d791e89fb69be885e
}