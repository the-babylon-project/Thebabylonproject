output "k8s-cluster-id" {
  value = oci_containerengine_cluster.k8s_cluster.id
}



# For the bucket in dev
output "buckets" {
  value = oci_objectstorage_bucket.dev_bucket.name
}