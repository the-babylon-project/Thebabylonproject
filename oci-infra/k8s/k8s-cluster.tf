provider "kubernetes" {
  config_path = "~/.kube/babylon-config"
}

provider "oci" {
  region = var.region
}

resource "kubernetes_namespace" "babylon_namespace" {
  metadata {
    name = "babylon-ns"
  }
}

resource "kubernetes_service" "nginx_service" {
  metadata {
    name      = "nginx-service"
    namespace = kubernetes_namespace.babylon_namespace.id
  }
  spec {
    selector = {
      app = "nginx"
    }
    port {
      port        = 80
      target_port = 80
      node_port   = 31600
    }

    type = "NodePort"
  }
}

data "oci_containerengine_node_pool" "babylon_np" {
  node_pool_id = var.node_pool_id
}

locals {
  active_nodes = [for node in data.oci_containerengine_node_pool.babylon_np.nodes : node if node.state == "ACTIVE"]
}

resource "oci_network_load_balancer_network_load_balancer" "babylon_nlb" {
  compartment_id = var.compartment_id
  display_name   = "babylon-nlb"
  subnet_id      = var.public_subnet_id

  is_private                     = false
  is_preserve_source_destination = false
}

resource "oci_network_load_balancer_backend_set" "babylon_nlb_backend_set" {
  health_checker {
    protocol = "TCP"
    port     = 10256
  }
  name                     = "babylon-backend-set"
  network_load_balancer_id = oci_network_load_balancer_network_load_balancer.babylon_nlb.id
  policy                   = "FIVE_TUPLE"

  is_preserve_source = false
}

resource "oci_network_load_balancer_backend" "babylon_nlb_backend" {
  count                    = length(local.active_nodes)
  backend_set_name         = oci_network_load_balancer_backend_set.babylon_nlb_backend_set.name
  network_load_balancer_id = oci_network_load_balancer_network_load_balancer.babylon_nlb.id
  port                     = 31600
  target_id                = local.active_nodes[count.index].id
}

resource "oci_network_load_balancer_listener" "babylon_nlb_listener" {
  default_backend_set_name = oci_network_load_balancer_backend_set.babylon_nlb_backend_set.name
  name                     = "babylon-nlb-listener"
  network_load_balancer_id = oci_network_load_balancer_network_load_balancer.babylon_nlb.id
  port                     = "80"
  protocol                 = "TCP"
}