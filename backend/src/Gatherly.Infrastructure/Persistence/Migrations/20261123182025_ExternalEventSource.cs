using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gatherly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ExternalEventSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "OrganizerId",
                table: "Events",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "Events",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalSource",
                table: "Events",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalUrl",
                table: "Events",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_ExternalSource_ExternalId",
                table: "Events",
                columns: new[] { "ExternalSource", "ExternalId" },
                unique: true,
                filter: "\"ExternalSource\" IS NOT NULL AND \"ExternalId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Events_ExternalSource_ExternalId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ExternalSource",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ExternalUrl",
                table: "Events");

            migrationBuilder.AlterColumn<string>(
                name: "OrganizerId",
                table: "Events",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
