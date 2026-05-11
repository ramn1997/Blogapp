using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlogApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Blogs_Category",
                table: "Blogs",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Blogs_CreatedAt",
                table: "Blogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Blogs_IsPublished",
                table: "Blogs",
                column: "IsPublished");

            migrationBuilder.CreateIndex(
                name: "IX_Blogs_PublishedAt",
                table: "Blogs",
                column: "PublishedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Blogs_Category",
                table: "Blogs");

            migrationBuilder.DropIndex(
                name: "IX_Blogs_CreatedAt",
                table: "Blogs");

            migrationBuilder.DropIndex(
                name: "IX_Blogs_IsPublished",
                table: "Blogs");

            migrationBuilder.DropIndex(
                name: "IX_Blogs_PublishedAt",
                table: "Blogs");
        }
    }
}
